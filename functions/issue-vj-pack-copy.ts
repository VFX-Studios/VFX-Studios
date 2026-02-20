import { withSecurity } from './_security.ts';
import { getClient } from './_client.ts';
import { validateMetadata } from './metadata-schema.ts';

Deno.serve(
  withSecurity(async (req) => {
    try {
      const base44 = getClient(req);
      const actor = await base44.auth.me();
      if (!actor) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { master_asset_id, buyer_user_id } = await req.json();
      if (!master_asset_id || !buyer_user_id) {
        return Response.json({ error: 'master_asset_id and buyer_user_id are required' }, { status: 400 });
      }

      const masters = await base44.asServiceRole.entities.MarketplaceAsset.filter({ id: master_asset_id });
      const master = masters[0];
      if (!master) {
        return Response.json({ error: 'Master asset not found' }, { status: 404 });
      }
      if (!(master.metadata?.is_master || master.status === 'master')) {
        return Response.json({ error: 'Not a master asset' }, { status: 400 });
      }

      const masterMetadata = master.metadata || {};
      let validatedMetadata;
      try {
        validatedMetadata = validateMetadata(masterMetadata);
      } catch (err) {
        return Response.json({ error: `Master metadata invalid: ${err.message}` }, { status: 400 });
      }

      // Clone fields for the buyer
      const copy = await base44.asServiceRole.entities.MarketplaceAsset.create({
        creator_user_id: master.creator_user_id,
        owner_user_id: buyer_user_id,
        title: `${master.title} (Copy)`,
        description: master.description,
        preview_url: master.preview_url,
        price: 0,
        category: master.category,
        status: 'purchased',
        tags: master.tags,
        metadata: {
          ...validatedMetadata,
          is_master: false,
          source_master_id: master_asset_id,
          assigned_to_user_id: buyer_user_id
        }
      });

      return Response.json({ success: true, copy_asset_id: copy.id });
    } catch (error) {
      console.error('issue-vj-pack-copy error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  })
);
