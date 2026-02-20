import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play, Check, Book, Zap, Music, Palette, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const tutorialSteps = [
  {
    category: 'Getting Started',
    icon: Book,
    steps: [
      {
        title: 'Create Your Account',
        description: 'Sign up with your email and get instant access to a 3-day free trial of all premium features.',
        tips: ['Use Google Sign-In for faster registration', 'Verify your email to unlock all features']
      },
      {
        title: 'Set Up Your Artist Profile',
        description: 'Navigate to Profile settings and add your artist name, genre, and bio to personalize your experience.',
        tips: ['Connect your social media', 'Upload a profile picture', 'Add your musical influences']
      },
      {
        title: 'Explore the Dashboard',
        description: 'Familiarize yourself with the main dashboard where you can access setlists, songs, and visual generation tools.',
        tips: ['Check out the Overview tab', 'Browse the AI Visual Generator', 'View your analytics']
      }
    ]
  },
  {
    category: 'Building Your First Setlist',
    icon: Music,
    steps: [
      {
        title: 'Create a New Setlist',
        description: 'Click "Create Setlist" on your dashboard. Name your set and optionally add festival/venue information.',
        tips: ['Use descriptive names like "Summer Festival 2026"', 'Add duration estimates for planning']
      },
      {
        title: 'Add Songs to Your Set',
        description: 'Upload songs manually or connect your music platforms (YouTube Music, Spotify, BandLab) to import tracks automatically.',
        tips: ['Upload files in MP3, WAV, or M4A format', 'AI will analyze tempo and energy automatically']
      },
      {
        title: 'Arrange Your Set Structure',
        description: 'Drag and drop songs to reorder them. Assign set sections: opener, build, peak, cooldown, or closer.',
        tips: ['Place high-energy tracks at peak', 'Use the emotional arc visualization', 'Balance fast and slow songs']
      },
      {
        title: 'Add VFX Notes',
        description: 'For each song, add visual storyboard notes describing the effects you want (colors, patterns, energy).',
        tips: ['Be specific: "Neon blue waves pulsing with bass"', 'Describe transitions between songs', 'Note key moments for visual changes']
      }
    ]
  },
  {
    category: 'AI Visual Generation',
    icon: Palette,
    steps: [
      {
        title: 'Generate AI Visuals',
        description: 'Use the AI Visual Generator on the dashboard. Describe the visual style you want in the text prompt.',
        tips: ['Try: "Cyberpunk city with neon reflections"', 'Reference multiple styles: "Impressionistic + Abstract"', 'Upload reference images for better results']
      },
      {
        title: 'Adjust Generation Settings',
        description: 'Set complexity, motion speed, and color intensity to match your music style.',
        tips: ['Higher complexity = more detailed visuals', 'Match motion speed to your BPM', 'Rate generated art to improve AI']
      },
      {
        title: 'Build Your Asset Library',
        description: 'Save generated visuals to your Asset Library. Upload custom videos, images, and shaders.',
        tips: ['Tag assets for easy searching', 'Create custom categories', 'Mark favorites for quick access']
      },
      {
        title: 'Use AI Smart Search',
        description: 'Search your library with natural language: "fiery abstract loops" or "chill blue waves".',
        tips: ['AI auto-tags all uploads', 'Search by mood, color, or style', 'Filter by asset type']
      }
    ]
  },
  {
    category: 'Live VJ Performance',
    icon: Zap,
    steps: [
      {
        title: 'Open the VJ Control Panel',
        description: 'From your Storyboard page, click any song to open the full VJ interface with real-time controls.',
        tips: ['Use keyboard shortcuts for quick access', 'Familiarize yourself with layer controls']
      },
      {
        title: 'Create and Save Presets',
        description: 'Adjust layers, effects, color grading, and save as presets for instant recall during performances.',
        tips: ['Name presets by mood or song', 'Create 3-5 presets per song', 'Test presets before live shows']
      },
      {
        title: 'Set Up Timeline Automation',
        description: 'Add timeline events to automate preset changes, effect triggers, and transitions at specific timestamps.',
        tips: ['Mark key moments: drops, breaks, buildups', 'Set transition durations', 'Test automation in practice mode']
      },
      {
        title: 'Use AI Co-Pilot',
        description: 'Enable the AI Assistant for real-time suggestions based on music energy and your preferences.',
        tips: ['Toggle "Auto Mode" for hands-free operation', 'Accept/reject suggestions to train AI', 'AI learns your style over time']
      },
      {
        title: 'Enable Performance Director',
        description: 'Activate AI Performance Director mode for proactive suggestions on transitions and preset changes.',
        tips: ['Director analyzes song structure', 'Suggests asset usage at optimal moments', 'Correlates with historical engagement data']
      }
    ]
  },
  {
    category: 'Live Streaming & Collaboration',
    icon: Video,
    steps: [
      {
        title: 'Start a Live Performance',
        description: 'Click "Go Live" to broadcast your VJ session. Set your stream as public or private.',
        tips: ['Test your connection first', 'Set a catchy stream title', 'Enable viewer reactions']
      },
      {
        title: 'Invite Collaborators',
        description: 'Generate a 6-digit session code to invite other VJs to join and suggest changes.',
        tips: ['Share code via social media', 'Set who can control', 'Use chat for coordination']
      },
      {
        title: 'Engage with Viewers',
        description: 'Viewers can send reactions (fire, energy, chill) that influence AI suggestions and analytics.',
        tips: ['Viewer reactions show as real-time emotes', 'AI adjusts to reaction trends', 'Review engagement in analytics']
      },
      {
        title: 'Record and Review',
        description: 'All live performances are automatically recorded with full state snapshots for later review.',
        tips: ['Recordings include all control changes', 'Review to improve future sets', 'Share recordings publicly']
      }
    ]
  },
  {
    category: 'Analytics & Platform Integration',
    icon: Users,
    steps: [
      {
        title: 'Connect Music Platforms',
        description: 'Go to Dashboard > Platform Connections and link Spotify, YouTube Music, BandLab, etc.',
        tips: ['OAuth authorization required', 'AI accesses your catalog for analysis', 'Sync tracks automatically']
      },
      {
        title: 'View Performance Analytics',
        description: 'Check the Analytics tab to see viewer engagement, reaction trends, and AI impact analysis.',
        tips: ['See which styles get most reactions', 'Track top engaging moments', 'Analyze emotional arc effectiveness']
      },
      {
        title: 'Review AI Learning Data',
        description: 'View what the AI has learned about your preferences: colors, styles, effects, and timing.',
        tips: ['AI improves with every performance', 'Manually adjust if AI misunderstands', 'Export your learning profile']
      }
    ]
  }
];

export default function Tutorial() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const toggleStep = (categoryIdx, stepIdx) => {
    const key = `${categoryIdx}-${stepIdx}`;
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-b border-purple-500/20 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-purple-500/20 text-purple-300 mb-4">
              <Book className="w-3 h-3 mr-1" />
              Complete Guide
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              VFX Studios Tutorial
            </h1>
            <p className="text-white/60 text-lg max-w-3xl">
              Master every feature of VFX Studios with this comprehensive step-by-step guide. 
              From creating your first setlist to performing live with AI assistance.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-6">
          {/* Category Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-2">
              {tutorialSteps.map((category, idx) => {
                const Icon = category.icon;
                const isActive = activeCategory === idx;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveCategory(idx)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-purple-500/20 border-purple-400/50 text-white'
                        : 'bg-black/20 border-white/10 text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-white/40'}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{category.category}</div>
                        <div className="text-xs text-white/40">{category.steps.length} steps</div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Steps Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {tutorialSteps[activeCategory].steps.map((step, stepIdx) => {
                  const isCompleted = completedSteps.has(`${activeCategory}-${stepIdx}`);
                  return (
                    <Card key={stepIdx} className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 border-white/10">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-green-500 border-green-500'
                                : 'bg-black/30 border-white/20'
                            }`}>
                              {isCompleted && <Check className="w-4 h-4 text-white" />}
                              {!isCompleted && <span className="text-xs text-white/60">{stepIdx + 1}</span>}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-white text-lg">{step.title}</CardTitle>
                              <p className="text-white/60 text-sm mt-2">{step.description}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isCompleted ? "outline" : "default"}
                            onClick={() => toggleStep(activeCategory, stepIdx)}
                            className={isCompleted ? "border-green-400/30 text-green-400" : ""}
                          >
                            {isCompleted ? 'Completed' : 'Mark Done'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                          <div className="text-white/80 text-sm font-medium mb-2">💡 Pro Tips:</div>
                          <ul className="space-y-1 text-sm text-white/60">
                            {step.tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Quick Links */}
            <Card className="mt-8 bg-gradient-to-br from-green-900/10 to-emerald-900/10 border-green-400/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  Ready to Get Started?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Link to={createPageUrl('Dashboard')} className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                      <Play className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Storyboard')} className="flex-1">
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      Create Your First Set
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}