import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Store subscription in user profile or separate entity
    await base44.auth.updateMe({
      push_subscription: JSON.stringify(subscription),
      push_enabled: true
    });

    console.log('[Push] User subscribed:', user.email);

    return Response.json({
      success: true,
      message: 'Push notifications enabled'
    });

  } catch (error) {
    console.error('[Push] Subscribe error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
