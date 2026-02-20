const DEFAULT_IMAGE_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';
const DEFAULT_TEXT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const DEFAULT_VIDEO_MODEL = 'cerspense/zeroscope_v2_576w';
const DEFAULT_ASSET3D_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';
const ENV = import.meta?.env || {};

function getApiKey() {
  return ENV.VITE_HF_API_KEY || '';
}

function toDataUrl(contentType, bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binary);
  return `data:${contentType};base64,${base64}`;
}

async function parseBinaryOrThrow(response, fallbackType) {
  const contentType = (response.headers.get('content-type') || fallbackType || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    const message = payload?.error || payload?.message || JSON.stringify(payload);
    throw new Error(`Hugging Face returned JSON response: ${message}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return toDataUrl(contentType || fallbackType || 'application/octet-stream', bytes);
}

async function callInferenceApi(model, body) {
  const key = getApiKey();
  if (!key) {
    throw new Error('Missing VITE_HF_API_KEY');
  }

  const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Hugging Face request failed (${response.status})`);
  }

  return response;
}

export const huggingFaceProvider = {
  name: 'huggingface',
  supports(task) {
    return task === 'image' || task === 'llm' || task === 'video' || task === 'asset3d';
  },
  async generateImage(params = {}) {
    const prompt = params.prompt;
    if (!prompt) {
      throw new Error('Prompt is required for image generation.');
    }

    const model = params.model || ENV.VITE_HF_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
    const response = await callInferenceApi(model, {
      inputs: prompt,
      options: { wait_for_model: true }
    });

    return {
      url: await parseBinaryOrThrow(response, 'image/png'),
      provider: 'huggingface'
    };
  },
  async generateVideo(params = {}) {
    const prompt = params.prompt;
    if (!prompt) {
      throw new Error('Prompt is required for video generation.');
    }

    const model = params.model || ENV.VITE_HF_VIDEO_MODEL || DEFAULT_VIDEO_MODEL;
    const response = await callInferenceApi(model, {
      inputs: prompt,
      options: { wait_for_model: true }
    });

    return {
      url: await parseBinaryOrThrow(response, 'video/mp4'),
      provider: 'huggingface',
      media_type: 'video'
    };
  },
  async generate3DAsset(params = {}) {
    const prompt = params.prompt;
    if (!prompt) {
      throw new Error('Prompt is required for 3D asset generation.');
    }

    const model = params.model || ENV.VITE_HF_3D_MODEL || DEFAULT_ASSET3D_MODEL;
    const response = await callInferenceApi(model, {
      inputs: prompt,
      options: { wait_for_model: true }
    });

    return {
      url: await parseBinaryOrThrow(response, 'application/octet-stream'),
      provider: 'huggingface',
      media_type: 'asset3d'
    };
  },
  async invokeLLM(params = {}) {
    const prompt = params.prompt;
    if (!prompt) {
      throw new Error('Prompt is required for LLM invocation.');
    }

    const model = params.model || ENV.VITE_HF_TEXT_MODEL || DEFAULT_TEXT_MODEL;
    const response = await callInferenceApi(model, {
      inputs: prompt,
      options: { wait_for_model: true }
    });

    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : data;
    const generatedText = first?.generated_text || first?.summary_text || first?.text || '';
    if (!generatedText) {
      throw new Error('No generated text returned by Hugging Face.');
    }

    return {
      text: generatedText,
      provider: 'huggingface'
    };
  }
};
