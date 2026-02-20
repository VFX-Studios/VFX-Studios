import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function PushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check for Push API support
    if ('Notification' in window && 'PushManager' in window) {
      setSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('[Push] Check subscription error:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!supported) {
      toast.error('Push notifications not supported');
      return;
    }

    setLoading(true);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        setLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      // VAPID public key would come from backend
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // TODO: Get from env
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Send subscription to backend
      await base44.functions.invoke('subscribe-push-notifications', {
        subscription: subscription.toJSON()
      });

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');

      // Send test notification
      await sendTestNotification();

    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      toast.error('Failed to enable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        await base44.functions.invoke('unsubscribe-push-notifications', {
          endpoint: subscription.endpoint
        });
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled');

    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      toast.error('Failed to disable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await base44.functions.invoke('send-push-notification', {
        title: 'VFX Studios',
        body: 'Push notifications are now enabled! You\'ll receive updates about your projects.',
        url: '/dashboard'
      });
    } catch (error) {
      console.error('[Push] Test notification error:', error);
    }
  };

  if (!supported) return null;

  return (
    <Card className="bg-white/5 border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-green-400" />
          ) : (
            <BellOff className="w-5 h-5 text-white/60" />
          )}
          <div>
            <div className="text-white font-semibold text-sm">Push Notifications</div>
            <div className="text-white/60 text-xs">
              {isSubscribed ? 'Enabled' : 'Get updates about your projects'}
            </div>
          </div>
        </div>
        
        <Button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={loading}
          size="sm"
          variant={isSubscribed ? 'outline' : 'default'}
          className={isSubscribed ? 'border-white/10 text-white' : 'bg-[#f5a623]'}
        >
          {loading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
        </Button>
      </div>
    </Card>
  );
}