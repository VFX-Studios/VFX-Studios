import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SocialAuthButtons({ onSuccess }) {
  const [loading, setLoading] = useState({ google: false, facebook: false });

  const handleGoogleAuth = async () => {
    setLoading({ ...loading, google: true });
    try {
      // Google OAuth flow
      const response = await base44.functions.invoke('google-auth', { action: 'login' });
      if (response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      toast.error('Google auth failed');
      setLoading({ ...loading, google: false });
    }
  };

  const handleFacebookAuth = async () => {
    setLoading({ ...loading, facebook: true });
    try {
      const response = await base44.functions.invoke('facebook-oauth', { action: 'get_auth_url' });
      if (response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      } else if (response.data?.setup_instructions) {
        toast.error(response.data.error);
        console.info('Setup:', response.data.setup_instructions);
        setLoading({ ...loading, facebook: false });
      }
    } catch (error) {
      toast.error('Facebook auth failed');
      setLoading({ ...loading, facebook: false });
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGoogleAuth}
        disabled={loading.google}
        className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
      >
        {loading.google ? (
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
        ) : (
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-5 h-5 mr-3"
          />
        )}
        Continue with Google
      </Button>

      <Button
        onClick={handleFacebookAuth}
        disabled={loading.facebook}
        className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white"
      >
        {loading.facebook ? (
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
        ) : (
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )}
        Continue with Facebook
      </Button>
    </div>
  );
}