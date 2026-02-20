import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();

    // Remove subscription from user profile
    await base44.auth.updateMe({
      push_subscription: null,
      push_enabled: false
    });

    console.log('[Push] User unsubscribed:', user.email);

    return Response.json({
      success: true,
      message: 'Push notifications disabled'
    });

  } catch (error) {
    console.error('[Push] Unsubscribe error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
