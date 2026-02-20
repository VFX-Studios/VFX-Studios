import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, format } = await req.json();

    // Get OAuth access token for Google Drive
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");

    // Fetch project data
    const project = await base44.entities.VJSession.get(project_id);
    if (!project || project.user_id !== user.id) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Convert to requested format
    let fileContent, mimeType, fileName;
    
    if (format === 'resolume') {
      // Resolume Arena/Avenue format (.avc)
      fileContent = JSON.stringify({
        version: "7.0",
        composition: {
          name: project.session_name,
          layers: project.layers || [],
          clips: project.clips || [],
          effects: project.effects || []
        }
      });
      mimeType = 'application/json';
      fileName = `${project.session_name}.avc`;
    } else if (format === 'touchdesigner') {
      // TouchDesigner format (.toe)
      fileContent = JSON.stringify({
        project_name: project.session_name,
        operators: project.parameters || {},
        network: project.visual_data || {}
      });
      mimeType = 'application/json';
      fileName = `${project.session_name}.toe.json`;
    } else if (format === 'madmapper') {
      // MadMapper format (.madmap)
      fileContent = JSON.stringify({
        name: project.session_name,
        surfaces: project.layers || [],
        materials: project.effects || [],
        version: "5.0"
      });
      mimeType = 'application/json';
      fileName = `${project.session_name}.madmap`;
    } else {
      // Default JSON export
      fileContent = JSON.stringify(project);
      mimeType = 'application/json';
      fileName = `${project.session_name}.json`;
    }

    // Upload to Google Drive
    const metadata = {
      name: fileName,
      mimeType: mimeType
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      fileContent +
      closeDelimiter;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Exported to Google Drive:', result.id);

    return Response.json({
      success: true,
      file_id: result.id,
      file_name: fileName,
      drive_url: `https://drive.google.com/file/d/${result.id}/view`
    });

  } catch (error) {
    console.error('gdrive-export error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
