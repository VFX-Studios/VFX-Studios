import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Music, Youtube, Film, Sparkles, Zap, TrendingUp, ShoppingBag, Globe, ArrowRight, Check, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import SEOHead from '@/components/seo/SEOHead';
import AudioReactiveHero from '@/components/visual/AudioReactiveHero';
import LoopPreviewGrid from '@/components/visual/LoopPreviewGrid';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const demographics = [
    { icon: Music, label: 'DJs & Musicians', color: 'from-purple-500 to-pink-500', desc: 'AI-driven VJ loops reacting to your sound' },
    { icon: Youtube, label: 'YouTubers', color: 'from-red-500 to-orange-500', desc: 'Captivating intros & dynamic stories' },
    { icon: Video, label: 'Vloggers', color: 'from-blue-500 to-cyan-500', desc: 'Engaging visual narratives made easy' },
    { icon: Film, label: 'Filmmakers', color: 'from-green-500 to-emerald-500', desc: 'Rapid prototyping & striking VFX' },
    { icon: ShoppingBag, label: 'Asset Creators', color: 'from-yellow-500 to-amber-500', desc: 'Monetize your creativity' }
  ];

  const features = [
    { icon: Sparkles, title: 'AI-Driven Asset Creation', desc: 'Generate bespoke visual effects tailored to your audio, mood, or creative brief' },
    { icon: Zap, title: 'Real-Time AI Suggestions', desc: 'Live performance AI analyzes audience reactions and adapts visuals instantly' },
    { icon: TrendingUp, title: 'Setlist Organizer', desc: 'Plan and manage performances with intuitive drag-and-drop interface' },
    { icon: Video, title: 'Storyboard Creator', desc: 'Visualize video content from concept to completion' },
    { icon: ShoppingBag, title: 'Asset Marketplace', desc: 'Access growing library of user-generated assets and templates' },
    { icon: Globe, title: '15 Monetization Avenues', desc: 'Sell assets, templates, AI styles, and B2B collaborations' }
  ];

  // Real-time stats from database
  const [stats, setStats] = useState([
    { value: '0', label: 'AI Assets Generated' },
    { value: '0', label: 'Active Creators' },
    { value: '$0', label: 'Creator Earnings' },
    { value: '99.9%', label: 'Uptime SLA' }
  ]);

  useEffect(() => {
    // Fetch real statistics from database
    const fetchStats = async () => {
      try {
        const [assets, users, earnings] = await Promise.all([
          base44.entities.VisualAsset.list(),
          base44.entities.User.list(),
          base44.entities.MarketplacePurchase.list()
        ]);

        const totalEarnings = earnings.reduce((sum, p) => sum + (p.price || 0), 0);

        setStats([
          { value: `${assets.length.toLocaleString()}+`, label: 'AI Assets Generated' },
          { value: `${users.length.toLocaleString()}+`, label: 'Active Creators' },
          { value: `$${totalEarnings.toLocaleString()}+`, label: 'Creator Earnings' },
          { value: '99.9%', label: 'Uptime SLA' }
        ]);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] overflow-hidden">
      <SEOHead
        title="VFX Studios - AI-Powered Visual Effects & Video Creation Platform"
        description="The revolutionary all-in-one platform for VJs, Musicians, YouTubers, Vloggers, and Filmmakers. Create, organize, and monetize stunning visual content with AI."
        keywords="vfx, visual effects, ai video editor, vj software, music video creator, youtube intro maker"
      />

      {/* Hero Section - VJ Mainstage */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Laser Grid */}
        <div className="absolute inset-0 bg-[#04040d]">
          <AudioReactiveHero className="absolute inset-0" />
        </div>

        {/* Floating Energy Orbs */}
        <motion.div
          className="absolute top-16 left-12 w-64 h-64 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-24 right-10 w-96 h-96 bg-gradient-to-br from-pink-500/20 to-amber-400/20 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white mb-6 px-4 py-2 animate-pulse-glow">
              Live VJ Engine · Audio-Reactive · AI-Native
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 leading-tight tracking-tight">
              VFX Studios Mainstage
            </h1>
            
            <p className="text-3xl md:text-4xl text-white/80 mb-6 font-light">
              Build, perform, and monetize immersive visuals in real time.
            </p>
            
            <div className="flex justify-center gap-6 mb-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 backdrop-blur-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                <span className="text-white/70 text-sm">Audio sync live · 120 BPM</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-[#f5a623]" />
                <span className="text-white/70 text-sm">Latency-safe render pipeline</span>
              </div>
            </div>

            <p className="text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed">
              Strap into a digital stage lit with neon beams, granular shaders, and AI co-pilots that orchestrate visuals to every drop.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to={createPageUrl('Dashboard')}>
                <Button className="beat-sync bg-gradient-to-r from-[#00eaff] to-[#ff2fb2] text-white px-9 py-6 text-lg hover:scale-105 transition animate-pulse-glow">
                  Launch Live Deck
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('Marketplace')}>
                <Button variant="outline" className="beat-sync border-white/20 text-white px-9 py-6 text-lg hover:bg-white/10 transition">
                  <Play className="w-5 h-5 mr-2" />
                  Preview Visual Packs
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="beat-sync bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/60 text-xs uppercase tracking-wide">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Demographics Section - Creator Grid */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">Built for Every Creator</h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Whether you're performing live, creating content, or building films, VFX Studios adapts to your workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {demographics.map((demo, i) => {
              const Icon = demo.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition group cursor-pointer h-full">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${demo.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{demo.label}</h3>
                    <p className="text-white/60 text-sm">{demo.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Microsoft/Google Style */}
      <section className="py-32 px-6 bg-gradient-to-br from-purple-900/10 to-pink-900/10 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">Powered by Intelligence</h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              First and only comprehensive AI VJ visual effects and video creator on the market
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-8 hover:bg-white/10 transition h-full">
                    <Icon className="w-12 h-12 text-[#f5a623] mb-4" />
                    <h3 className="text-white font-semibold text-xl mb-3">{feature.title}</h3>
                    <p className="text-white/60">{feature.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Monetization Section - Tesla-Inspired */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Badge className="bg-green-500/20 text-green-300 mb-6 px-4 py-2">
              💰 Creator Economy
            </Badge>
            
            <h2 className="text-5xl font-bold text-white mb-6">15 Ways to Monetize</h2>
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
              We believe in empowering creators financially. Sell assets, templates, AI styles, 
              or partner with music hardware companies, venues, and festivals.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              {['Sell Assets', 'Custom Templates', 'AI Styles', 'B2B Partnerships', 'Hardware Collabs', 'Festival Licensing'].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">{item}</span>
                </motion.div>
              ))}
            </div>

            <Link to={createPageUrl('Marketplace')}>
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg">
                Explore Marketplace
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Marketplace Loop Previews */}
      <section className="py-24 px-6 bg-[#050510] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none animate-pan-bg opacity-20" style={{ backgroundImage: 'linear-gradient(120deg, rgba(0,234,255,0.12) 0%, rgba(255,47,178,0.12) 50%, rgba(255,196,0,0.12) 100%)' }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-3">Loop Packs in Motion</h2>
            <p className="text-white/60">Preview live loops from the marketplace—optimized for LED walls and festival rigs.</p>
          </div>
          <LoopPreviewGrid />
        </div>
      </section>

      {/* Why Section - Apple Philosophy */}
      <section className="py-32 px-6 bg-gradient-to-br from-blue-900/10 to-purple-900/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-white mb-6">Why VFX Studios?</h2>
            <p className="text-2xl text-white/80 leading-relaxed mb-8">
              We redefine <span className="text-[#f5a623]">accessibility</span>, 
              <span className="text-[#e91e8c]"> creativity</span>, and 
              <span className="text-purple-400"> profitability</span> for independent artists and content creators.
            </p>
            <p className="text-xl text-white/60 leading-relaxed">
              We believe in providing innovative tools that are both powerful and user-friendly, 
              allowing you to focus on your vision while our AI handles the complexity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-bold text-white mb-6">Join the Visual Revolution</h2>
            <p className="text-2xl text-white/60 mb-12">
              Create, perform, and earn with VFX Studios
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] text-white px-12 py-8 text-xl hover:scale-105 transition">
                  Get Started Free
                  <Sparkles className="w-6 h-6 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('Pricing')}>
                <Button variant="outline" className="border-white/20 text-white px-12 py-8 text-xl hover:bg-white/10 transition">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('Dashboard')} className="text-white/60 hover:text-white block text-sm">Dashboard</Link>
                <Link to={createPageUrl('Marketplace')} className="text-white/60 hover:text-white block text-sm">Marketplace</Link>
                <Link to={createPageUrl('Tutorials')} className="text-white/60 hover:text-white block text-sm">Tutorials</Link>
                <Link to={createPageUrl('Pricing')} className="text-white/60 hover:text-white block text-sm">Pricing</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('Blog')} className="text-white/60 hover:text-white block text-sm">Blog</Link>
                <Link to={createPageUrl('Partnerships')} className="text-white/60 hover:text-white block text-sm">Partnerships</Link>
                <Link to={createPageUrl('SOC2Compliance')} className="text-white/60 hover:text-white block text-sm">Security</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('Terms')} className="text-white/60 hover:text-white block text-sm">Terms</Link>
                <a href="mailto:support@vfxstudios.com" className="text-white/60 hover:text-white block text-sm">Support</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Social</h4>
              <div className="space-y-2">
                <a href="#" className="text-white/60 hover:text-white block text-sm">Twitter</a>
                <a href="#" className="text-white/60 hover:text-white block text-sm">Discord</a>
                <a href="#" className="text-white/60 hover:text-white block text-sm">YouTube</a>
              </div>
            </div>
          </div>
          <div className="text-center text-white/40 text-sm pt-8 border-t border-white/10">
            © 2026 VFX Studios. The AI-Powered Canvas for Dynamic Visuals.
          </div>
        </div>
      </footer>
    </div>
  );
}
