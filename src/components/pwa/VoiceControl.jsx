import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceControl({ onCommand }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('[Voice] Recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript || finalTranscript);

        // Process final command
        if (finalTranscript) {
          processVoiceCommand(finalTranscript.trim().toLowerCase());
        }
      };

      recognition.onerror = (event) => {
        console.error('[Voice] Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable in browser settings.');
        } else {
          toast.error(`Voice recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('[Voice] Recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('[Voice] Web Speech API not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processVoiceCommand = (command) => {
    console.log('[Voice] Processing command:', command);

    // Video Editor Commands
    const commands = {
      // Playback
      'play': () => onCommand?.('play'),
      'pause': () => onCommand?.('pause'),
      'stop': () => onCommand?.('stop'),
      
      // Editing
      'cut': () => onCommand?.('cut'),
      'cut this clip': () => onCommand?.('cut'),
      'split': () => onCommand?.('split'),
      'split clip': () => onCommand?.('split'),
      'duplicate': () => onCommand?.('duplicate'),
      'duplicate frame': () => onCommand?.('duplicate'),
      'undo': () => onCommand?.('undo'),
      'redo': () => onCommand?.('redo'),
      
      // Navigation
      'go back': () => onCommand?.('rewind', 5),
      'rewind': () => onCommand?.('rewind', 5),
      'skip forward': () => onCommand?.('forward', 5),
      'fast forward': () => onCommand?.('forward', 5),
      'go to start': () => onCommand?.('seek', 0),
      'go to beginning': () => onCommand?.('seek', 0),
      'go to end': () => onCommand?.('seek', -1),
      
      // Trim
      'set trim start': () => onCommand?.('trim-start'),
      'trim start': () => onCommand?.('trim-start'),
      'set trim end': () => onCommand?.('trim-end'),
      'trim end': () => onCommand?.('trim-end'),
      'apply trim': () => onCommand?.('apply-trim'),
      
      // AI
      'get suggestions': () => onCommand?.('ai-suggestions'),
      'ai suggestions': () => onCommand?.('ai-suggestions'),
      'analyze video': () => onCommand?.('ai-suggestions'),
      
      // Export
      'export': () => onCommand?.('export'),
      'export video': () => onCommand?.('export'),
      'download': () => onCommand?.('export'),
    };

    // Check for exact match
    if (commands[command]) {
      commands[command]();
      toast.success(`✓ ${command}`);
      speak(`Executing ${command}`);
      return;
    }

    // Check for partial matches
    for (const [key, action] of Object.entries(commands)) {
      if (command.includes(key)) {
        action();
        toast.success(`✓ ${key}`);
        speak(`Executing ${key}`);
        return;
      }
    }

    // No match found
    toast.error(`Command not recognized: "${command}"`);
    speak('Command not recognized. Try "play", "pause", "cut", or "split".');
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!supported) {
      toast.error('Voice control not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      speak('Voice control activated. Say "cut", "play", "pause", or other commands.');
    }
  };

  if (!supported) return null;

  return (
    <div className="relative">
      <Button
        onClick={toggleListening}
        variant={isListening ? 'default' : 'outline'}
        className={isListening ? 'bg-red-500 hover:bg-red-600' : 'border-white/10 text-white'}
      >
        {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
        {isListening ? 'Stop' : 'Voice Control'}
      </Button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 z-10"
          >
            <Card className="bg-red-500/10 border-red-500/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-300 text-sm font-semibold">Listening...</span>
              </div>
              {transcript && (
                <div className="text-white text-sm bg-black/20 rounded p-2">
                  "{transcript}"
                </div>
              )}
              <div className="text-white/60 text-xs mt-2">
                Try: "play", "pause", "cut", "split", "duplicate", "export"
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}