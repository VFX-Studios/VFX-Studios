import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Menu, User, Settings, LogOut, Home, Music, Zap, DollarSign, Shield, ChevronDown, Trophy, BookOpen, Video, Wand2, Brain, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import SacredGeometryBackground from "@/components/backgrounds/SacredGeometryBackground";
import AnimatedGridBackground from "@/components/backgrounds/AnimatedGridBackground";
import PWAInstaller from "@/components/pwa/PWAInstaller";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { I18nProvider } from "@/components/i18n/TranslationProvider";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (userData) => {
      setUser(userData);
      
      // Check if user needs onboarding
      const progress = await base44.entities.OnboardingProgress.filter({ user_id: userData.id });
      if (!progress[0] || (!progress[0].tour_completed && !progress[0].skipped)) {
        setShowOnboarding(true);
      }
    }).catch(() => {});
  }, []);

  const isAuthPage = currentPageName === 'Auth' || currentPageName === 'Terms' || currentPageName === 'Home';

  const backgroundVariant = currentPageName === 'Dashboard' ? 'resolume' : 
                           currentPageName === 'Storyboard' ? 'touchdesigner' : 
                           'ai';

  return (
    <HelmetProvider>
      <I18nProvider>
      <div className="min-h-screen bg-[#050510] relative">
        {/* Dynamic background based on page */}
        {!isAuthPage && (
          currentPageName === 'Home' ? (
            <SacredGeometryBackground variant="metatron" intensity={0.2} />
          ) : (
            <AnimatedGridBackground style={backgroundVariant} />
          )
        )}
        
        {showOnboarding && currentPageName === 'Dashboard' && (
          <OnboardingTour onComplete={() => setShowOnboarding(false)} />
        )}
        <style>{`
        :root {
          --background: 230 30% 3%;
          --foreground: 0 0% 95%;
        }
        body {
          background: #050510;
          color: #f0f0f0;
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
        }
      `}</style>

      {!isAuthPage && user && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a2e]/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698a816b7fb66be353c5c0c9/d42fee127_image.png"
                alt="VFX Studios"
                className="w-8 h-8"
              />
              <span className="text-white font-light text-lg">VFX Studios</span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Main Navigation */}
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                  <Menu className="w-5 h-5" />
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a0a3e] border-white/10">
                  <Link to={createPageUrl('Dashboard')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Storyboard')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Music className="w-4 h-4 mr-2" />
                      Storyboard
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Marketplace')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Zap className="w-4 h-4 mr-2" />
                      Marketplace
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Blog')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Music className="w-4 h-4 mr-2" />
                      Blog
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Tutorials')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Tutorials
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Achievements')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Trophy className="w-4 h-4 mr-2" />
                      Achievements
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('LiveStream')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Video className="w-4 h-4 mr-2" />
                      Live Streams
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('AISetlistGenerator')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Wand2 className="w-4 h-4 mr-2" />
                      AI Setlist Generator
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('AgentDashboard')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Brain className="w-4 h-4 mr-2" />
                      AI Agents
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Analytics')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Pricing')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pricing
                    </DropdownMenuItem>
                  </Link>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <Link to={createPageUrl('Admin')}>
                        <DropdownMenuItem className="text-[#f5a623] hover:text-[#e91e8c] cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link to={createPageUrl('AdminTestDashboard')}>
                        <DropdownMenuItem className="text-[#f5a623] hover:text-[#e91e8c] cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          System Tests
                        </DropdownMenuItem>
                      </Link>
                      <Link to={createPageUrl('DeploymentCenter')}>
                        <DropdownMenuItem className="text-[#f5a623] hover:text-[#e91e8c] cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          Deployment
                        </DropdownMenuItem>
                      </Link>
                      <Link to={createPageUrl('SOC2Compliance')}>
                        <DropdownMenuItem className="text-[#f5a623] hover:text-[#e91e8c] cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          SOC 2 Compliance
                        </DropdownMenuItem>
                      </Link>
                      </>
                      )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="w-9 h-9 border-2 border-[#f5a623]/30 cursor-pointer hover:border-[#f5a623] transition-colors">
                    <AvatarFallback className="bg-[#f5a623] text-white text-sm">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a0a3e] border-white/10">
                  <div className="px-3 py-2 border-b border-white/10">
                    <div className="text-white text-sm font-medium">{user?.full_name || 'User'}</div>
                    <div className="text-white/40 text-xs">{user?.email}</div>
                  </div>
                  <Link to={createPageUrl('Profile')}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('Profile') + '?tab=settings'}>
                    <DropdownMenuItem className="text-white/70 hover:text-white cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => base44.auth.logout()}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>
      )}

        <div className={!isAuthPage && user ? 'pt-16' : ''}>
          {children}
        </div>

        {/* PWA Installer Prompt */}
        {!isAuthPage && <PWAInstaller />}
      </div>
      </I18nProvider>
    </HelmetProvider>
  );
}