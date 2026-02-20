import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceControl({ onCommand }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSupported(true);
      
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.toLowerCase();
        
        setTranscript(text);

        // Detect VFX commands
        if (text.includes('hey vfx') || text.includes('hey effects')) {
          const command = text.replace(/hey vfx|hey effects/g, '').trim();
          
          if (command.includes('apply') || command.includes('use')) {
            // Extract style name
            const styles = ['cyberpunk', 'organic', 'geometric', 'abstract', 'neon', 'glitch', 'watercolor', 'fire'];
            const detectedStyle = styles.find(s => command.includes(s));
            
            if (detectedStyle) {
              handleVoiceCommand('apply_style', detectedStyle);
            }
          } else if (command.includes('increase') || command.includes('raise')) {
            if (command.includes('brightness')) handleVoiceCommand('adjust', { brightness: 'up' });
            if (command.includes('intensity')) handleVoiceCommand('adjust', { intensity: 'up' });
          } else if (command.includes('decrease') || command.includes('lower')) {
            if (command.includes('brightness')) handleVoiceCommand('adjust', { brightness: 'down' });
            if (command.includes('intensity')) handleVoiceCommand('adjust', { intensity: 'down' });
          } else if (command.includes('next') || command.includes('switch')) {
            handleVoiceCommand('next_visual');
          } else if (command.includes('stop') || command.includes('clear')) {
            handleVoiceCommand('stop_all');
          }
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied');
        }
      };

      recognitionInstance.onend = () => {
        if (listening) {
          // Restart if still supposed to be listening
          recognitionInstance.start();
        }
      };

      setRecognition(recognitionInstance);
    }
  }, [listening]);

  const handleVoiceCommand = (action, params = {}) => {
    toast.success(`Voice command: ${action}`);
    if (onCommand) {
      onCommand(action, params);
    }
  };

  const toggleListening = () => {
    if (!supported) {
      toast.error('Voice control not supported in this browser');
      return;
    }

    if (listening) {
      recognition?.stop();
      setListening(false);
      toast.info('Voice control stopped');
    } else {
      recognition?.start();
      setListening(true);
      toast.success('Voice control active! Say "Hey VFX, apply cyberpunk style"');
    }
  };

  if (!supported) {
    return (
      <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
        <div className="text-yellow-300 text-sm">
          ⚠️ Voice control requires Chrome, Edge, or Safari
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-5 h-5 text-[#f5a623]" />
            <span className="text-white font-semibold">Voice Control</span>
            {listening && (
              <Badge className="bg-red-500 animate-pulse">Live</Badge>
            )}
          </div>
          {transcript && (
            <div className="text-white/60 text-xs mt-1">
              "{transcript}"
            </div>
          )}
        </div>

        <Button
          onClick={toggleListening}
          className={listening ? 'bg-red-600 hover:bg-red-700' : 'bg-[#f5a623] hover:bg-[#e91e8c]'}
        >
          {listening ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Voice Control
            </>
          )}
        </Button>
      </div>

      {listening && (
        <div className="mt-4 text-white/60 text-xs space-y-1">
          <div className="font-semibold text-white/80 mb-2">Voice Commands:</div>
          <div>• "Hey VFX, apply [style name]"</div>
          <div>• "Hey VFX, increase brightness"</div>
          <div>• "Hey VFX, next visual"</div>
          <div>• "Hey VFX, stop all effects"</div>
        </div>
      )}
    </Card>
  );
}