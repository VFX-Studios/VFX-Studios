import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { font_asset_id, font_name, font_file_url } = await req.json();

    if (!font_asset_id && !font_name) {
      return Response.json({ error: 'Provide font_asset_id or font_name' }, { status: 400 });
    }

    // Known protected fonts (simplified database)
    const protectedFonts = [
      'Helvetica', 'Helvetica Neue', 'Arial', 'Times New Roman', 'Futura',
      'Garamond', 'Baskerville', 'Bodoni', 'Gotham', 'Proxima Nova',
      'Avenir', 'Gill Sans', 'Trade Gothic', 'Akzidenz-Grotesk', 'Univers',
      'Frutiger', 'FF Din', 'Brandon Grotesque', 'Circular', 'San Francisco'
    ];

    // Open source fonts (allowed)
    const openSourceFonts = [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway',
      'PT Sans', 'Lora', 'Merriweather', 'Nunito', 'Ubuntu', 'Playfair Display'
    ];

    const fontNameLower = (font_name || '').toLowerCase();

    // Check for exact or close matches
    let matchFound = false;
    let matchedFont = null;
    let isOpenSource = false;

    for (const protectedFont of protectedFonts) {
      if (fontNameLower.includes(protectedFont.toLowerCase()) || 
          protectedFont.toLowerCase().includes(fontNameLower)) {
        matchFound = true;
        matchedFont = protectedFont;
        break;
      }
    }

    for (const openFont of openSourceFonts) {
      if (fontNameLower.includes(openFont.toLowerCase())) {
        isOpenSource = true;
        matchedFont = openFont;
        break;
      }
    }

    // Use AI to analyze font if available
    let aiAnalysis = null;
    if (font_file_url) {
      try {
        aiAnalysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this font and determine if it matches any known protected fonts:

**Font Name:** ${font_name}

Compare to these protected fonts and provide a similarity score (0-1):
${protectedFonts.join(', ')}

Also check if it's an open-source font:
${openSourceFonts.join(', ')}

Return JSON:
{
  "match_found": true/false,
  "matched_font": "Font Name" or null,
  "similarity_score": 0.0-1.0,
  "is_open_source": true/false,
  "confidence": 0.0-1.0
}`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              match_found: { type: "boolean" },
              matched_font: { type: "string" },
              similarity_score: { type: "number" },
              is_open_source: { type: "boolean" },
              confidence: { type: "number" }
            }
          }
        });

        if (aiAnalysis.similarity_score > 0.9) {
          matchFound = true;
          matchedFont = aiAnalysis.matched_font;
          isOpenSource = aiAnalysis.is_open_source;
        }
      } catch (error) {
        console.error('AI analysis failed:', error);
      }
    }

    // Determine verification status
    let status, action, rejectionReason;

    if (isOpenSource) {
      status = 'verified';
      action = 'approved';
      rejectionReason = null;
    } else if (matchFound) {
      status = 'needs_documentation';
      action = 'require_proof';
      rejectionReason = `Font matches protected '${matchedFont}'. Please provide proof of license purchase or ownership rights.`;
    } else {
      status = 'verified';
      action = 'approved';
      rejectionReason = null;
    }

    // Update FontAsset if provided
    if (font_asset_id) {
      await base44.entities.FontAsset.update(font_asset_id, {
        copyright_verified: status === 'verified',
        copyright_check_status: status,
        rejection_reason: rejectionReason
      });
    }

    return Response.json({
      success: true,
      verification: {
        status,
        action,
        match_found: matchFound,
        matched_font: matchedFont,
        similarity_score: aiAnalysis?.similarity_score || (matchFound ? 1.0 : 0.0),
        is_open_source: isOpenSource,
        rejection_reason: rejectionReason
      },
      message: status === 'verified' 
        ? 'Font verified - no copyright issues detected'
        : `Font requires documentation: ${rejectionReason}`
    });

  } catch (error) {
    console.error('verify-font-copyright error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
