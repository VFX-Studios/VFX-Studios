import { withSecurity } from './_security.ts';
import { getClient } from './_client.ts';
import { validateMetadata } from './metadata-schema.ts';

Deno.serve(
  withSecurity(async (req) => {
    try {
      const base44 = getClient(req);
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload = await req.json();
      const {
        title = 'Audio Reactive Shader Pack',
        description = 'Beat-synced WebGL hero + mic-reactive intensity.',
        preview_url,
        price = 9.99,
        category = 'vj_loop',
        metadata = {}
      } = payload;

      const validatedMetadata = validateMetadata(metadata);

      // Minimal required fields for marketplace asset
      const asset = await base44.asServiceRole.entities.MarketplaceAsset.create({
        creator_user_id: user.id,
        title,
        description,
        preview_url: preview_url || 'https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4',
        price,
        category,
        tags: ['audio-reactive', 'webgl', 'vj', 'shader'],
        metadata: {
          ...validatedMetadata,
          repo_files: [
            'src/components/visual/AudioReactiveHero.jsx',
            'src/components/visual/LoopPreviewGrid.jsx',
            'src/index.css'
          ],
          instructions: 'Import AudioReactiveHero into your hero; apply .beat-sync class to elements you want pulsing. Mic permission optional.'
        },
        status: 'published'
      });

      return Response.json({ success: true, asset_id: asset.id });
    } catch (error) {
      console.error('publish-audio-reactive-pack error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  })
);
