import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';

export default function InteractiveTutorial({ currentPage }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const getTutorialStepMutation = useMutation({
    mutationFn: async (context) => {
      const { data } = await base44.functions.invoke('ai-tutorial-guide', context);
      return data;
    },
    onSuccess: (data) => {
      setCurrentStep(data.tutorial_step);
    }
  });

  const markStepCompleteMutation = useMutation({
    mutationFn: async (stepId) => {
      const progressList = await base44.entities.TutorialProgress.filter({
        user_id: user.id
      });
      
      if (progressList.length > 0) {
        const progress = progressList[0];
        const completed = [...(progress.completed_steps || []), stepId];
        await base44.entities.TutorialProgress.update(progress.id, {
          completed_steps: completed,
          current_step: null
        });
      } else {
        await base44.entities.TutorialProgress.create({
          user_id: user.id,
          completed_steps: [stepId],
          current_step: null
        });
      }
    }
  });

  useEffect(() => {
    if (isActive && user) {
      getTutorialStepMutation.mutate({
        current_page: currentPage,
        current_action: 'viewing',
        user_role: 'general'
      });
    }
  }, [isActive, currentPage]);

  const handleComplete = () => {
    if (currentStep?.step_id) {
      markStepCompleteMutation.mutate(currentStep.step_id);
    }
    // Load next step
    getTutorialStepMutation.mutate({
      current_page: currentPage,
      current_action: 'completed_step'
    });
  };

  if (!isActive) {
    return (
      <Button
        onClick={() => setIsActive(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-lg"
        size="lg"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Start Tutorial
      </Button>
    );
  }

  return (
    <AnimatePresence>
      {currentStep && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50 w-96"
        >
          <Card className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-md border-purple-400/30 shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                  <h3 className="text-white font-semibold">{currentStep.title}</h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsActive(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {currentStep.instruction}
              </p>

              {currentStep.tips && currentStep.tips.length > 0 && (
                <div className="bg-black/30 rounded-lg p-3 mb-4 border border-white/10">
                  <div className="flex items-center gap-2 text-white/80 text-xs font-medium mb-2">
                    <HelpCircle className="w-3 h-3" />
                    Pro Tips
                  </div>
                  <ul className="space-y-1 text-white/70 text-xs">
                    {currentStep.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-400">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => getTutorialStepMutation.mutate({
                    current_page: currentPage,
                    current_action: 'skip'
                  })}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}