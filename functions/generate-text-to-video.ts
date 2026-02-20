import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      prompt, 
      model = 'runway-gen3',
      frames = 16,
      fps = 24,
      motion_strength = 127,
      negative_prompt = '',
      steps = 28,
      guidance_scale = 7.5
    } = await req.json();

    // Check credits
    if ((user.ai_credits_remaining || 0) < 15) {
      return Response.json({ 
        error: 'Insufficient credits. Text-to-video requires 15 credits.' 
      }, { status: 402 });
    }

    console.log(`Generating video with ${model}: "${prompt}"`);

    // Generate video using AI
    let videoUrl;
    
    if (model === 'runway-gen3') {
      // Runway Gen-3 via API
      const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Generate a video from this description: ${prompt}\n\nNegative prompt: ${negative_prompt}`,
        add_context_from_internet: false
      });
      
      // In production: Call actual Runway API
      // For now, simulate with image-to-video approach
      videoUrl = await generateVideoFromFrames(prompt, frames, fps, base44);
      
    } else if (model === 'animatediff-xl') {
      // AnimateDiff approach
      videoUrl = await generateAnimateDiff(prompt, frames, motion_strength, base44);
      
    } else if (model === 'pika-1.5') {
      // Pika Labs approach
      videoUrl = await generatePikaVideo(prompt, base44);
      
    } else {
      // Fallback: Generate sequence of images and compile
      videoUrl = await generateVideoFromFrames(prompt, frames, fps, base44);
    }

    // Deduct credits
    await base44.asServiceRole.entities.User.update(user.id, {
      ai_credits_remaining: (user.ai_credits_remaining || 0) - 15
    });

    // Save to database
    const asset = await base44.entities.VisualAsset.create({
      user_id: user.id,
      name: prompt.slice(0, 100),
      type: 'video',
      file_url: videoUrl,
      generation_params: { model, prompt, frames, fps, motion_strength },
      ai_generated: true
    });

    console.log('Video generated:', asset.id);

    return Response.json({
      success: true,
      video_url: videoUrl,
      asset_id: asset.id,
      credits_remaining: (user.ai_credits_remaining || 0) - 15
    });

  } catch (error) {
    console.error('generate-text-to-video error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper: Generate video from frame sequence
async function generateVideoFromFrames(prompt, frameCount, fps, base44) {
  const frames = [];
  
  for (let i = 0; i < frameCount; i++) {
    const framePrompt = `${prompt}, frame ${i + 1}/${frameCount}, smooth animation`;
    
    const response = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: framePrompt
    });
    
    frames.push(response.url);
  }

  // In production: Compile frames into video using FFmpeg or similar
  // For now, return first frame as placeholder
  return frames[0];
}

// Helper: AnimateDiff generation
async function generateAnimateDiff(prompt, frames, motionStrength, base44) {
  // In production: Call AnimateDiff API or run locally
  const response = await base44.asServiceRole.integrations.Core.GenerateImage({
    prompt: `${prompt}, animated, cinematic motion`
  });
  
  return response.url;
}

// Helper: Pika Labs generation
async function generatePikaVideo(prompt, base44) {
  // In production: Call Pika API
  const response = await base44.asServiceRole.integrations.Core.GenerateImage({
    prompt: `${prompt}, video still, motion blur`
  });
  
  return response.url;
}

