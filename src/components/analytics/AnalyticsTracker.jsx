import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Client-side analytics tracking component
 * Usage: <AnalyticsTracker /> in Layout.js
 */
export default function AnalyticsTracker() {
  const sessionId = useRef(null);

  useEffect(() => {
    // Generate session ID
    sessionId.current = crypto.randomUUID();

    // Track page views
    const trackPageView = () => {
      if (typeof window === 'undefined') return;
      
      base44.functions.invoke('track-analytics-event', {
        event_type: 'page_view',
        metadata: {
          session_id: sessionId.current,
          path: window.location.pathname,
          referrer: document.referrer
        }
      }).catch(() => {});
    };

    trackPageView();

    // Track video views
    const trackVideoView = (videoId) => {
      base44.functions.invoke('track-analytics-event', {
        event_type: 'video_view',
        entity_id: videoId,
        entity_type: 'VideoProject',
        metadata: {
          session_id: sessionId.current
        }
      }).catch(() => {});
    };

    // Expose tracking functions globally
    window.trackVideoView = trackVideoView;

    // Track watch time
    window.trackWatchTime = (videoId, seconds) => {
      base44.functions.invoke('track-analytics-event', {
        event_type: 'video_watch_time',
        entity_id: videoId,
        entity_type: 'VideoProject',
        value: seconds,
        metadata: {
          session_id: sessionId.current
        }
      }).catch(() => {});
    };

    // Track thumbnail clicks
    window.trackThumbnailClick = (videoId) => {
      base44.functions.invoke('track-analytics-event', {
        event_type: 'thumbnail_click',
        entity_id: videoId,
        entity_type: 'VideoProject',
        metadata: {
          session_id: sessionId.current
        }
      }).catch(() => {});
    };

    return () => {
      // Cleanup
      delete window.trackVideoView;
      delete window.trackWatchTime;
      delete window.trackThumbnailClick;
    };
  }, []);

  return null; // No visual component
}