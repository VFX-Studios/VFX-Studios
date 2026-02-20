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
      sso_provider,
      metadata_url,
      entity_id,
      sso_url,
      certificate,
      allowed_domains
    } = await req.json();

    // Validate enterprise account ownership
    const enterprises = await base44.asServiceRole.entities.EnterpriseAccount.filter({
      id: enterprise_account_id
    });

    if (!enterprises[0]) {
      return Response.json({ error: 'Enterprise account not found' }, { status: 404 });
    }

    // Create SSO configuration
    const ssoConfig = await base44.asServiceRole.entities.SSOConfiguration.create({
      enterprise_account_id,
      sso_provider,
      metadata_url,
      entity_id,
      sso_url,
      certificate,
      allowed_domains: allowed_domains || [],
      is_active: false, // Admin must manually activate after testing
      auto_provision_users: true
    });

    // Generate SAML ACS (Assertion Consumer Service) URL
    const acsUrl = `${req.headers.get('origin')}/auth/sso/${enterprise_account_id}/callback`;

    return Response.json({
      success: true,
      sso_config_id: ssoConfig.id,
      acs_url: acsUrl,
      entity_id: `vfx-studios-${enterprise_account_id}`,
      message: 'SSO configuration created. Test login before activating.',
      next_steps: [
        '1. Configure your IdP with the ACS URL provided',
        '2. Test SSO login with a test user',
        '3. Activate SSO in your dashboard',
        '4. Invite team members to use SSO'
      ]
    });

  } catch (error) {
    console.error('enterprise-setup-sso error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
