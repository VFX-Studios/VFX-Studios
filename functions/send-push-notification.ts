import { getClient } from './_client.ts';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url, user_id } = await req.json();

    // Get target user's subscription
    const targetUser = user_id ? 
      (await base44.asServiceRole.entities.User.filter({ id: user_id }))[0] : 
      user;

    if (!targetUser || !targetUser.push_subscription) {
      return Response.json({ error: 'User not subscribed to push notifications' }, { status: 404 });
    }

    const subscription = JSON.parse(targetUser.push_subscription);

    // Configure VAPID keys (from environment)
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@vfxstudios.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[Push] VAPID keys not configured');
      return Response.json({ error: 'Push notifications not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Send push notification
    const payload = JSON.stringify({
      title: title || 'VFX Studios',
      body: body || 'You have a new notification',
      icon: '/icon-192.png',
      url: url || '/'
    });

    await webpush.sendNotification(subscription, payload);

    console.log('[Push] Notification sent to:', targetUser.email);

    return Response.json({
      success: true,
      message: 'Push notification sent'
    });

  } catch (error) {
    console.error('[Push] Send notification error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
