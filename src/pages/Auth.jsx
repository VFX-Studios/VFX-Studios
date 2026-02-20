import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
          callback: handleGoogleResponse
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('google-auth', {
        credential: response.credential
      });

      if (data.success) {
        toast.success(data.isNewUser ? 'Account created!' : 'Welcome back!');
        window.location.href = createPageUrl('Dashboard');
      }
    } catch (error) {
      toast.error('Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error('You must agree to the Terms of Service');
      return;
    }
    
    setLoading(true);

    try {
      const passwordHash = await hashPassword(password);
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Send verification email
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Verify your VJ Platform account',
        body: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`
      });

      // Store user data temporarily (in real app, use secure temporary storage)
      sessionStorage.setItem('pending_signup', JSON.stringify({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        verification_code: code,
        verification_expires: expiresAt
      }));

      setStep('verification');
      toast.success('Verification code sent to your email');
    } catch (error) {
      toast.error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pending = JSON.parse(sessionStorage.getItem('pending_signup'));
      
      if (!pending || pending.verification_code !== verificationCode) {
        toast.error('Invalid verification code');
        setLoading(false);
        return;
      }

      if (new Date(pending.verification_expires) < new Date()) {
        toast.error('Verification code expired');
        setLoading(false);
        return;
      }

      // Create user via invite (simplified - in production use proper user creation)
      await base44.users.inviteUser(email, 'user');
      
      // Update user with password hash and verification
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        password_hash: pending.password_hash,
        email_verified: true
      });

      // Create artist profile
      await base44.entities.Artist.create({
        user_id: user.id,
        artist_name: pending.full_name
      });

      sessionStorage.removeItem('pending_signup');
      toast.success('Account created successfully!');
      window.location.href = '/';
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const passwordHash = await hashPassword(password);
      
      // In production, implement proper authentication
      // This is a simplified version
      base44.auth.redirectToLogin(window.location.pathname);
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#1a0a3e] to-[#050510] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-[#f5a623]" />
            <h1 className="text-3xl font-light text-white">VFX Studios</h1>
          </div>
          <p className="text-white/40 text-sm">Professional visual production tools</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
          {step === 'credentials' ? (
            <>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={mode === 'login' ? 'default' : 'outline'}
                  onClick={() => setMode('login')}
                  className="flex-1"
                >
                  Login
                </Button>
                <Button
                  variant={mode === 'signup' ? 'default' : 'outline'}
                  onClick={() => setMode('signup')}
                  className="flex-1"
                >
                  Sign Up
                </Button>
              </div>

              <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <Label className="text-white/70">Full Name / Artist Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-white/70">Email</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70">Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={agreedToTerms}
                      onCheckedChange={setAgreedToTerms}
                      className="mt-1"
                    />
                    <Label className="text-white/60 text-xs leading-relaxed">
                      I agree to the{' '}
                      <Link to={createPageUrl('Terms')} className="text-[#f5a623] hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and understand that a 3-day free trial will begin, after which my payment method will be charged.
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || (mode === 'signup' && !agreedToTerms)}
                  className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90"
                >
                  {mode === 'signup' ? 'Sign Up' : 'Login'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#1a0a3e] px-2 text-white/40">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={triggerGoogleSignIn}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-white hover:bg-white/90 text-gray-900 border-0"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {mode === 'signup' ? 'Sign up with Google' : 'Login with Google'}
                </Button>
                </form>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-white text-xl mb-2">Verify Your Email</h2>
                <p className="text-white/40 text-sm">
                  We sent a 6-digit code to {email}
                </p>
              </div>

              <div>
                <Label className="text-white/70">Verification Code</Label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-2 bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90"
              >
                Verify Account
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('credentials')}
                className="w-full text-white/60"
              >
                Back
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}