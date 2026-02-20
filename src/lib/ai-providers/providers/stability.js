const STABILITY_ENDPOINT = 'https://api.stability.ai/v2beta/stable-image/generate/core';
const ENV = import.meta?.env || {};

function getApiKey() {
  return ENV.VITE_STABILITY_API_KEY || '';
}

function parseGenerationResponse(responseText) {
  try {
    const data = JSON.parse(responseText);
    const image = data?.image || data?.artifacts?.[0]?.base64;
    if (!image) {
      throw new Error('No image field in Stability response.');
    }
    return `data:image/png;base64,${image}`;
  } catch (error) {
    throw new Error(`Invalid Stability response: ${error.message}`);
  }
}

export const stabilityProvider = {
  name: 'stability',
  supports(task) {
    return task === 'image';
  },
  async generateImage(params = {}) {
    const key = getApiKey();
    if (!key) {
      throw new Error('Missing VITE_STABILITY_API_KEY');
    }
    if (!params.prompt) {
      throw new Error('Prompt is required for image generation.');
    }

    const formData = new FormData();
    formData.append('prompt', params.prompt);
    formData.append('output_format', 'png');
    if (params.width) formData.append('width', String(params.width));
    if (params.height) formData.append('height', String(params.height));

    const response = await fetch(STABILITY_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Stability request failed (${response.status})`);
    }

    const text = await response.text();
    return {
      url: parseGenerationResponse(text),
      provider: 'stability'
    };
  }
};
