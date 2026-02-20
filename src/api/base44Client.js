import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import {
  generateImageWithProviders,
  generateVideoWithProviders,
  generate3DAssetWithProviders,
  invokeLLMWithProviders,
  parseJsonFromText
} from '@/lib/ai-providers';
import { createSupabaseCompatClient, isSupabaseConfigured } from '@/api/supabaseCompatClient';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const sdkClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});
const ENV = import.meta?.env || {};
const useSupabase = ENV.VITE_USE_SUPABASE === 'true' && isSupabaseConfigured();
const baseClient = useSupabase ? createSupabaseCompatClient() : sdkClient;

const originalGenerateImage = baseClient.integrations?.Core?.GenerateImage
  ? baseClient.integrations.Core.GenerateImage.bind(baseClient.integrations.Core)
  : null;

const originalInvokeLLM = baseClient.integrations?.Core?.InvokeLLM
  ? baseClient.integrations.Core.InvokeLLM.bind(baseClient.integrations.Core)
  : null;

function useProviderRouter() {
  return ENV.VITE_USE_AI_PROVIDER_ROUTER !== 'false';
}

if (!baseClient.integrations) {
  baseClient.integrations = {};
}
if (!baseClient.integrations.Core) {
  baseClient.integrations.Core = {};
}

baseClient.integrations.Core.GenerateImage = async (params = {}) => {
  if (!useProviderRouter() || !params?.prompt) {
    if (originalGenerateImage) {
      return originalGenerateImage(params);
    }
    throw new Error('GenerateImage unavailable: missing original SDK method and provider routing disabled.');
  }

  try {
    return await generateImageWithProviders(params);
  } catch (providerError) {
    if (originalGenerateImage) {
      return originalGenerateImage(params);
    }
    throw providerError;
  }
};

baseClient.integrations.Core.GenerateVideo = async (params = {}) => {
  if (!useProviderRouter() || !params?.prompt) {
    if (originalGenerateImage) {
      return originalGenerateImage(params);
    }
    throw new Error('GenerateVideo unavailable: missing fallback method and provider routing disabled.');
  }

  try {
    return await generateVideoWithProviders(params);
  } catch (providerError) {
    if (originalGenerateImage) {
      return originalGenerateImage(params);
    }
    throw providerError;
  }
};

baseClient.integrations.Core.Generate3DAsset = async (params = {}) => {
  if (!useProviderRouter() || !params?.prompt) {
    if (originalGenerateImage) {
      return originalGenerateImage(params);
    }
    throw new Error('Generate3DAsset unavailable: missing fallback method and provider routing disabled.');
  }

  try {
    return await generate3DAssetWithProviders(params);
  } catch (providerError) {
    if (originalGenerateImage) {
      return originalGenerateImage(params);
    }
    throw providerError;
  }
};

baseClient.integrations.Core.InvokeLLM = async (params = {}) => {
  if (!useProviderRouter() || !params?.prompt) {
    if (originalInvokeLLM) {
      return originalInvokeLLM(params);
    }
    throw new Error('InvokeLLM unavailable: missing original SDK method and provider routing disabled.');
  }

  try {
    const providerResult = await invokeLLMWithProviders(params);
    if (params.response_json_schema) {
      if (providerResult && typeof providerResult === 'object' && !providerResult.text) {
        return providerResult;
      }
      if (providerResult?.text && typeof providerResult.text === 'string') {
        return parseJsonFromText(providerResult.text);
      }
    }
    return providerResult.text ? { text: providerResult.text, provider: providerResult.provider } : providerResult;
  } catch (providerError) {
    if (originalInvokeLLM) {
      return originalInvokeLLM(params);
    }
    throw providerError;
  }
};

//Create a client with authentication required
export const base44 = baseClient;
