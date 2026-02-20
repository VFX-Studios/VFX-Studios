import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug, Zap, Box } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function HardwareIntegration() {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [connecting, setConnecting] = useState(null);

  const hardware = [
    {
      type: 'midi_controller',
      name: 'MIDI Controller',
      icon: Plug,
      devices: ['Akai APC40', 'Novation Launchpad', 'Native Instruments Maschine'],
      description: 'Map knobs and pads to VFX parameters'
    },
    {
      type: 'dmx_lighting',
      name: 'DMX Lighting',
      icon: Zap,
      devices: ['DMX512 via USB', 'Art-Net Network'],
      description: 'Sync visuals with stage lighting in real-time'
    },
    {
      type: 'stream_deck',
      name: 'Elgato Stream Deck',
      icon: Box,
      devices: ['Stream Deck (15 keys)', 'Stream Deck XL (32 keys)', 'Stream Deck Mini'],
      description: 'One-button shortcuts for styles and effects'
    }
  ];

  const connectHardware = async (type, deviceName) => {
    setConnecting(type);
    
    try {
      // Request MIDI access (Web MIDI API)
      if (type === 'midi_controller' && navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess();
        const inputs = Array.from(midiAccess.inputs.values());
        
        if (inputs.length === 0) {
          toast.error('No MIDI devices found. Connect your controller.');
          setConnecting(null);
          return;
        }

        // Listen for MIDI messages
        inputs[0].onmidimessage = (message) => {
          const [status, note, velocity] = message.data;
          console.log('MIDI:', { status, note, velocity });
          
          // Map to VFX controls
          if (status === 176) { // Control Change
            toast.success(`MIDI CC ${note}: ${velocity}`);
          }
        };

        toast.success(`${deviceName} connected via MIDI`);
      } else if (type === 'dmx_lighting') {
        // DMX requires WebUSB or external software bridge
        toast.info('DMX: Install VFX Studios Bridge software for DMX support');
        window.open('https://vfxstudios.com/dmx-bridge', '_blank');
      } else if (type === 'stream_deck') {
        // Stream Deck requires plugin
        toast.info('Stream Deck: Install VFX Studios plugin from Elgato Marketplace');
        window.open('https://marketplace.elgato.com', '_blank');
      }

      // Save connection to database
      const connection = await base44.entities.HardwareConnection.create({
        user_id: (await base44.auth.me()).id,
        hardware_type: type,
        device_name: deviceName,
        is_active: true
      });

      setConnectedDevices([...connectedDevices, connection]);
      
    } catch (error) {
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="space-y-4">
      {hardware.map((hw, i) => {
        const Icon = hw.icon;
        const connected = connectedDevices.find(d => d.hardware_type === hw.type);
        
        return (
          <Card key={i} className="bg-white/5 border-white/10 p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e91e8c] flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold">{hw.name}</h3>
                  {connected && (
                    <Badge className="bg-green-500">Connected</Badge>
                  )}
                </div>
                <p className="text-white/60 text-sm mb-3">{hw.description}</p>
                
                {!connected ? (
                  <div className="space-y-2">
                    {hw.devices.map((device, j) => (
                      <Button
                        key={j}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white mr-2"
                        onClick={() => connectHardware(hw.type, device)}
                        disabled={connecting === hw.type}
                      >
                        {connecting === hw.type ? 'Connecting...' : `Connect ${device}`}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-green-400 text-sm">
                    ✓ {connected.device_name} is active
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
        <div className="text-blue-300 text-sm">
          <div className="font-semibold mb-2">💡 Pro Tip</div>
          <div className="text-blue-200/70">
            Hardware integrations work best with the desktop app. Browser support is limited for DMX and Stream Deck.
          </div>
        </div>
      </Card>
    </div>
  );
}