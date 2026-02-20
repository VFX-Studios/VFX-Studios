import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    // Get all user's assets
    const assets = await base44.entities.VisualAsset.filter({ user_id: user.id });

    // Use AI to understand the query and match assets
    const searchPrompt = `User is searching for VJ assets with this query: "${query}"

Available assets with their tags:
${assets.map((a, i) => `${i + 1}. ${a.name} - Tags: ${a.tags?.join(', ') || 'none'}`).join('\n')}

Based on the query, return the indices (1-based) of the most relevant assets in order of relevance.
Understand natural language (e.g., "fiery abstract loops" should match fire/red/abstract/loop tags).`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          matching_indices: {
            type: "array",
            items: { type: "number" },
            description: "1-based indices of matching assets in order of relevance"
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of matches"
          }
        }
      }
    });

    // Map indices back to actual assets
    const matchedAssets = result.matching_indices
      .map(idx => assets[idx - 1])
      .filter(Boolean);

    return Response.json({
      success: true,
      assets: matchedAssets,
      reasoning: result.reasoning
    });
  } catch (error) {
    console.error('Smart search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
