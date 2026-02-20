import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_id, source_format } = await req.json();

    // Get OAuth access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");

    // Download file from Google Drive
    const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file_id}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!fileResponse.ok) {
      throw new Error('Failed to download file from Google Drive');
    }

    const fileContent = await fileResponse.text();
    let projectData = JSON.parse(fileContent);

    // Convert from source format to our format
    let convertedProject;
    
    if (source_format === 'resolume') {
      convertedProject = {
        session_name: projectData.composition?.name || 'Imported Resolume Project',
        layers: projectData.composition?.layers || [],
        clips: projectData.composition?.clips || [],
        effects: projectData.composition?.effects || []
      };
    } else if (source_format === 'touchdesigner') {
      convertedProject = {
        session_name: projectData.project_name || 'Imported TD Project',
        parameters: projectData.operators || {},
        visual_data: projectData.network || {}
      };
    } else if (source_format === 'madmapper') {
      convertedProject = {
        session_name: projectData.name || 'Imported MadMapper Project',
        layers: projectData.surfaces || [],
        effects: projectData.materials || []
      };
    } else {
      convertedProject = projectData;
    }

    // Create new VJ session
    const session = await base44.entities.VJSession.create({
      user_id: user.id,
      ...convertedProject,
      imported_from: source_format,
      imported_at: new Date().toISOString()
    });

    console.log('Imported project:', session.id);

    return Response.json({
      success: true,
      session_id: session.id,
      session_name: session.session_name
    });

  } catch (error) {
    console.error('gdrive-import error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
