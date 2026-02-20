function buildImageUrl({ prompt, width = 1024, height = 1024, model = 'flux', seed }) {
  const encodedPrompt = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model,
    nologo: 'true'
  });
  if (seed !== undefined && seed !== null) {
    params.set('seed', String(seed));
  }

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
}

async function invokeTextLLM({ prompt, model = 'openai' }) {
  const encodedPrompt = encodeURIComponent(prompt);
  const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=${encodeURIComponent(model)}`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error(`Pollinations text request failed (${response.status})`);
  }

  const text = await response.text();
  return text;
}

export const pollinationsProvider = {
  name: 'pollinations',
  supports(task) {
    return task === 'image' || task === 'llm' || task === 'video';
  },
  async generateImage(params = {}) {
    if (!params.prompt) {
      throw new Error('Prompt is required for image generation.');
    }

    const width = Number(params.width) || 1024;
    const height = Number(params.height) || 1024;
    const url = buildImageUrl({
      prompt: params.prompt,
      width,
      height,
      model: params.model || 'flux',
      seed: params.seed
    });

    return {
      url,
      provider: 'pollinations'
    };
  },
  async generateVideo(params = {}) {
    // Pollinations does not currently expose a stable text-to-video endpoint.
    // We return a frame render so callers still get deterministic output.
    const frame = await this.generateImage({
      ...params,
      prompt: `${params.prompt || ''} cinematic motion frame`
    });

    return {
      ...frame,
      media_type: 'image'
    };
  },
  async invokeLLM(params = {}) {
    if (!params.prompt) {
      throw new Error('Prompt is required for LLM invocation.');
    }

    const text = await invokeTextLLM({
      prompt: params.prompt,
      model: params.model || 'openai'
    });

    return {
      text,
      provider: 'pollinations'
    };
  }
};
