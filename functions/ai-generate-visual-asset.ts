import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      song_id, 
      song_metadata, 
      resolution = '4k',
      format = 'image',
      user_prompt = null 
    } = await req.json();

    if (!song_id && !user_prompt) {
      return Response.json({ error: 'song_id or user_prompt required' }, { status: 400 });
    }

    // Fetch user's learning data for style preferences
    const learningData = await base44.entities.AILearningData.filter(
      { user_id: user.id },
      '-created_date',
      50
    );

    const stylePreferences = extractStylePreferences(learningData);
    const colorPreferences = extractColorPreferences(learningData);

    // Build detailed prompt for high-quality generation
    let basePrompt = '';
    
    if (song_metadata) {
      basePrompt = `Create a high-resolution, professional-grade abstract visual asset for VJ performance.

**Song Context:**
- Title: ${song_metadata.title}
- BPM: ${song_metadata.bpm}
- Energy: ${song_metadata.energy}/10
- Mood: ${song_metadata.mood}
- Section: ${song_metadata.section}

**User Style Preferences:**
${stylePreferences.length > 0 ? `- Preferred styles: ${stylePreferences.join(', ')}` : '- No strong preferences yet'}
${colorPreferences.preferred_hue !== null ? `- Preferred hue range: ${colorPreferences.preferred_hue}° (${getColorName(colorPreferences.preferred_hue)})` : ''}

**Requirements:**
- ${resolution === '4k' ? '3840x2160 resolution, ultra-detailed' : '1920x1080 HD resolution'}
- ${format === 'animation' ? 'Looping animation pattern, seamless 10-second loop' : 'Static high-resolution image'}
- Abstract, generative art style suitable for live projection
- Rich color palette matching the song's emotional tone
- Avoid text, faces, or recognizable objects
- Optimized for visual effects layering (blend modes)

Style: ${song_metadata.energy >= 7 ? 'high-energy, dynamic, explosive patterns' : song_metadata.energy >= 4 ? 'medium energy, flowing abstract forms' : 'calm, ambient, ethereal gradients'}`;
    } else {
      basePrompt = `Create a high-resolution abstract visual asset for VJ performance: ${user_prompt}

**Requirements:**
- ${resolution === '4k' ? '3840x2160 resolution, ultra-detailed' : '1920x1080 HD resolution'}
- ${format === 'animation' ? 'Looping animation pattern' : 'Static image'}
- Professional VJ-grade quality
- Abstract, suitable for live projection`;
    }

    // Generate the visual using AI
    const imageResult = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: basePrompt,
    });

    if (!imageResult.url) {
      throw new Error('Image generation failed');
    }

    // Create thumbnail (using the same image for now)
    const thumbnailUrl = imageResult.url;

    // Save to user's asset library
    const asset = await base44.entities.VisualAsset.create({
      user_id: user.id,
      name: song_metadata ? `${song_metadata.title} - AI Generated` : `AI Asset ${Date.now()}`,
      file_url: imageResult.url,
      thumbnail_url: thumbnailUrl,
      type: format === 'animation' ? 'animation' : 'image',
      tags: [
        'ai-generated',
        resolution,
        song_metadata?.mood || 'abstract',
        song_metadata?.section || 'general',
        ...stylePreferences.slice(0, 2),
      ],
      description: `AI-generated ${format} based on ${song_metadata ? `song: ${song_metadata.title}` : 'custom prompt'}`,
      is_public: false,
      usage_count: 0,
      rating: null,
    });

    // Log generation for learning
    await base44.entities.GeneratedArt.create({
      user_id: user.id,
      prompt: basePrompt,
      style: stylePreferences.join(', ') || 'default',
      reference_image_urls: [],
      generated_image_url: imageResult.url,
      music_context: song_metadata || {},
      parameters: {
        resolution,
        format,
        color_preferences: colorPreferences,
      },
      user_rating: null,
      used_in_performance: false,
    });

    // Log to Notion for training
    try {
      await base44.functions.invoke('log-to-notion', {
        entry_type: 'visual_generation',
        data: {
          asset_id: asset.id,
          user_id: user.id,
          song_title: song_metadata?.title || 'Custom',
          prompt: basePrompt,
          resolution,
          format,
          style_preferences: stylePreferences,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (notionError) {
      console.error('Notion logging failed (non-critical):', notionError);
    }

    return Response.json({
      success: true,
      asset: {
        id: asset.id,
        name: asset.name,
        file_url: asset.file_url,
        thumbnail_url: asset.thumbnail_url,
        type: asset.type,
        tags: asset.tags,
      },
      message: 'Visual asset generated and saved to library!',
    });

  } catch (error) {
    console.error('AI Visual Asset Generation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractStylePreferences(learningData) {
  const styles = {};
  learningData.forEach(d => {
    if (d.style_tags) {
      d.style_tags.forEach(tag => {
        if (tag !== 'ai-copilot' && tag !== 'accepted' && tag !== 'rejected') {
          styles[tag] = (styles[tag] || 0) + 1;
        }
      });
    }
  });
  return Object.entries(styles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([style]) => style);
}

function extractColorPreferences(learningData) {
  const hues = [];
  learningData.forEach(d => {
    if (d.parameters?.color_grading?.hue) {
      hues.push(d.parameters.color_grading.hue);
    }
  });
  
  if (hues.length === 0) return { preferred_hue: null };
  
  const avg = hues.reduce((sum, h) => sum + h, 0) / hues.length;
  return { preferred_hue: Math.round(avg) };
}

function getColorName(hue) {
  if (hue < 30) return 'Red';
  if (hue < 60) return 'Orange';
  if (hue < 90) return 'Yellow';
  if (hue < 150) return 'Green';
  if (hue < 210) return 'Cyan';
  if (hue < 270) return 'Blue';
  if (hue < 330) return 'Purple';
  return 'Red';
}

