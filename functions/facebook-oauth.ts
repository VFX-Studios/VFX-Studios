import { getClient } from './_client.ts';

// Facebook OAuth Implementation
// Required: Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in Dashboard > Integrations

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const { action, code, state } = await req.json();

    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const REDIRECT_URI = `${req.headers.get('origin')}/auth/facebook/callback`;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return Response.json({
        error: 'Facebook OAuth not configured',
        setup_instructions: 'Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in Dashboard > Integrations'
      }, { status: 500 });
    }

    if (action === 'get_auth_url') {
      // Generate OAuth URL
      const params = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        redirect_uri: REDIRECT_URI,
        state: crypto.randomUUID(),
        scope: 'email,public_profile',
        response_type: 'code'
      });

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;

      return Response.json({ auth_url: authUrl });
    }

    if (action === 'handle_callback') {
      // Exchange code for access token
      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const { access_token } = await tokenResponse.json();

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`
      );

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await profileResponse.json();

      // Create or update user
      const existingUsers = await base44.asServiceRole.entities.User.filter({
        email: profile.email
      });

      let user;
      if (existingUsers[0]) {
        user = existingUsers[0];
      } else {
        user = await base44.asServiceRole.entities.User.create({
          email: profile.email,
          full_name: profile.name,
          role: 'user',
          ai_credits_remaining: 5 // Welcome bonus
        });
      }

      // Store connected account
      await base44.asServiceRole.entities.ConnectedAccount.create({
        user_id: user.id,
        provider: 'facebook',
        provider_account_id: profile.id,
        access_token: access_token,
        profile_data: profile
      });

      console.log('Facebook OAuth successful:', user.id);

      return Response.json({
        success: true,
        user_id: user.id,
        email: user.email,
        name: user.full_name
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('facebook-oauth error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
