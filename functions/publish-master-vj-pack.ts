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
        title = 'Audio Reactive VJ Pack (Master)',
        description = 'Master source for audio-reactive hero + beat-synced UI pulses.',
        preview_url,
        metadata = {}
      } = payload;

      const validatedMetadata = validateMetadata(metadata);

      const master = await base44.asServiceRole.entities.MarketplaceAsset.create({
        creator_user_id: user.id,
        title,
        description,
        preview_url: preview_url || 'https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4',
        price: 0,
        category: 'vj_pack',
        status: 'master',
        tags: ['master', 'audio-reactive', 'vj', 'shader'],
        metadata: {
          ...validatedMetadata,
          is_master: true,
          master_owner_user_id: user.id,
          repo_files: [
            'src/components/visual/AudioReactiveHero.jsx',
            'src/components/visual/LoopPreviewGrid.jsx',
            'src/index.css'
          ],
          notes: validatedMetadata.notes || 'Copies are minted per buyer; master never leaves owner.'
        }
      });

      return Response.json({ success: true, master_asset_id: master.id });
    } catch (error) {
      console.error('publish-master-vj-pack error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  })
);
