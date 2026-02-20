import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, style, styleBlend, referenceImages, musicContext, adaptiveMode } = await req.json();

    // Get user's learned preferences
    const learningInsights = await base44.functions.invoke('ai-learn', {
      learningData: { user_id: user.id, learning_type: 'style_preference', parameters: {} }
    });

    const preferences = learningInsights.data?.insights || {};

    // Build enhanced prompt with style and context
    let enhancedPrompt = prompt;

    if (styleBlend && styleBlend.styles && styleBlend.styles.length > 0) {
      const styleDescriptions = styleBlend.styles
        .map(s => `${s} (${styleBlend.weights[s] || 33}% influence)`)
        .join(', ');
      enhancedPrompt = `Blend these styles together: ${styleDescriptions}. Visual: ${prompt}`;
    } else if (style) {
      enhancedPrompt = `${style} style: ${prompt}`;
    }

    if (musicContext) {
      const moodDescriptors = {
        high_energy: 'dynamic, energetic, vibrant',
        medium_energy: 'balanced, flowing, rhythmic',
        low_energy: 'calm, ethereal, atmospheric'
      };
      const energyLevel = musicContext.energy_level > 7 ? 'high_energy' : 
                         musicContext.energy_level > 4 ? 'medium_energy' : 'low_energy';
      enhancedPrompt += `, ${moodDescriptors[energyLevel]}`;
    }

    // Add learned user preferences
    if (preferences.topStyles?.length > 0) {
      enhancedPrompt += `, incorporating ${preferences.topStyles[0]} elements`;
    }

    // Generate image with optional reference images
    const { url } = await base44.integrations.Core.GenerateImage({
      prompt: enhancedPrompt,
      existing_image_urls: referenceImages || []
    });

    // Store generated art
    const artRecord = await base44.entities.GeneratedArt.create({
      user_id: user.id,
      prompt,
      style: styleBlend ? JSON.stringify(styleBlend) : (style || 'default'),
      reference_image_urls: referenceImages || [],
      generated_image_url: url,
      music_context: musicContext,
      parameters: { adaptiveMode, preferences, styleBlend }
    });

    return Response.json({
      success: true,
      imageUrl: url,
      artId: artRecord.id,
      appliedPreferences: preferences
    });
  } catch (error) {
    console.error('Art generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
