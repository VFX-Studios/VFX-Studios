import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      enterprise_account_id,
      custom_logo_url,
      custom_domain,
      primary_color,
      secondary_color,
      company_name,
      hide_vfx_studios_branding,
      custom_email_domain,
      favicon_url
    } = await req.json();

    // Verify enterprise account has white-label enabled
    const enterprises = await base44.asServiceRole.entities.EnterpriseAccount.filter({
      id: enterprise_account_id
    });

    if (!enterprises[0]) {
      return Response.json({ error: 'Enterprise account not found' }, { status: 404 });
    }

    if (!enterprises[0].white_label_enabled) {
      return Response.json({
        error: 'White-label not enabled',
        message: 'Upgrade to Enterprise tier to access white-labeling',
        upgrade_url: '/enterprise/pricing'
      }, { status: 403 });
    }

    // Check if configuration exists
    const existingConfigs = await base44.asServiceRole.entities.WhiteLabelConfig.filter({
      enterprise_account_id
    });

    let config;
    if (existingConfigs[0]) {
      // Update existing
      config = await base44.asServiceRole.entities.WhiteLabelConfig.update(existingConfigs[0].id, {
        custom_logo_url,
        custom_domain,
        primary_color,
        secondary_color,
        company_name,
        hide_vfx_studios_branding: hide_vfx_studios_branding || false,
        custom_email_domain,
        favicon_url
      });
    } else {
      // Create new
      config = await base44.asServiceRole.entities.WhiteLabelConfig.create({
        enterprise_account_id,
        custom_logo_url,
        custom_domain,
        primary_color,
        secondary_color,
        company_name,
        hide_vfx_studios_branding: hide_vfx_studios_branding || false,
        custom_email_domain,
        favicon_url
      });
    }

    // Generate custom CSS based on brand colors
    const customCSS = `
      :root {
        --brand-primary: ${primary_color || '#f5a623'};
        --brand-secondary: ${secondary_color || '#e91e8c'};
      }
      .brand-gradient {
        background: linear-gradient(135deg, ${primary_color} 0%, ${secondary_color} 100%);
      }
    `;

    await base44.asServiceRole.entities.WhiteLabelConfig.update(config.id, {
      custom_css: customCSS
    });

    return Response.json({
      success: true,
      config_id: config.id,
      preview_url: custom_domain ? `https://${custom_domain}` : null,
      message: 'White-label configuration saved successfully',
      dns_instructions: custom_domain ? {
        type: 'CNAME',
        name: custom_domain,
        value: 'vfx-studios-cdn.com',
        ttl: 3600
      } : null
    });

  } catch (error) {
    console.error('enterprise-configure-whitelabel error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
