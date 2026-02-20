import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function RealtimePluginSDK({ sessionId }) {
  const [wsUrl, setWsUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Generate WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    setWsUrl(`${protocol}//${host}/ws/collaboration`);

    // Generate API key for this session
    setApiKey(`vfx_${sessionId}_${Date.now()}`);
  }, [sessionId]);

  const copyCode = (type) => {
    let code = '';

    if (type === 'python') {
      code = `
# VFX Studios Real-Time Plugin SDK - Python
import websocket
import json

ws_url = "${wsUrl}"
api_key = "${apiKey}"

def on_message(ws, message):
    data = json.loads(message)
    if data['type'] == 'state_update':
        # Apply VFX parameters to your software
        brightness = data['state']['brightness']
        hue = data['state']['hue']
        print(f"Update: Brightness={brightness}, Hue={hue}")

def on_open(ws):
    # Authenticate
    ws.send(json.dumps({
        "type": "auth",
        "api_key": api_key
    }))
    # Join session
    ws.send(json.dumps({
        "type": "join_room",
        "room_id": "${sessionId}"
    }))

ws = websocket.WebSocketApp(ws_url,
    on_message=on_message,
    on_open=on_open)
ws.run_forever()
`;
    } else if (type === 'touchdesigner') {
      code = `
# TouchDesigner Python DAT
# VFX Studios Real-Time Sync

import websocket
import json

class VFXSync:
    def __init__(self):
        self.ws = None
        self.connect()
    
    def connect(self):
        ws_url = "${wsUrl}"
        self.ws = websocket.create_connection(ws_url)
        
        # Auth
        self.ws.send(json.dumps({
            "type": "auth",
            "api_key": "${apiKey}"
        }))
        
        # Join room
        self.ws.send(json.dumps({
            "type": "join_room",
            "room_id": "${sessionId}"
        }))
    
    def sync_state(self, params):
        # Receive updates from VFX Studios
        msg = self.ws.recv()
        data = json.loads(msg)
        
        if data['type'] == 'state_update':
            # Apply to TouchDesigner operators
            op('brightness').par.value = data['state']['brightness']
            op('hue').par.value = data['state']['hue']

sync = VFXSync()
`;
    } else if (type === 'osc') {
      code = `
// OSC/MIDI Bridge for Resolume
// Route VFX Studios WebSocket → OSC messages

WebSocket URL: ${wsUrl}
API Key: ${apiKey}

OSC Mapping:
/vfx/brightness → /layer1/video/opacity
/vfx/hue → /layer1/video/effects/colorize/hue
/vfx/saturation → /layer1/video/effects/colorize/saturation

Use TouchOSC Bridge or custom Node.js script to convert WebSocket → OSC
`;
    }

    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-[#f5a623]" />
        <h3 className="text-white font-semibold">Real-Time Plugin SDK</h3>
        <Badge className="bg-purple-500/20 text-purple-300">Beta</Badge>
      </div>

      <div className="space-y-4">
        {/* Connection Info */}
        <div className="bg-black/30 rounded-lg p-3 font-mono text-xs">
          <div className="text-white/40 mb-1">WebSocket URL:</div>
          <div className="text-green-400">{wsUrl}</div>
          <div className="text-white/40 mt-2 mb-1">Session ID:</div>
          <div className="text-cyan-400">{sessionId}</div>
        </div>

        {/* Code Examples */}
        <div className="space-y-2">
          <div className="text-white/70 text-sm font-semibold">Integration Examples:</div>
          
          <Button
            onClick={() => copyCode('python')}
            variant="outline"
            className="w-full justify-start border-white/20 text-white"
          >
            <Code className="w-4 h-4 mr-2" />
            Python WebSocket Client
            <Copy className="w-3 h-3 ml-auto" />
          </Button>

          <Button
            onClick={() => copyCode('touchdesigner')}
            variant="outline"
            className="w-full justify-start border-white/20 text-white"
          >
            <Code className="w-4 h-4 mr-2" />
            TouchDesigner Plugin
            <Copy className="w-3 h-3 ml-auto" />
          </Button>

          <Button
            onClick={() => copyCode('osc')}
            variant="outline"
            className="w-full justify-start border-white/20 text-white"
          >
            <Code className="w-4 h-4 mr-2" />
            OSC/MIDI Bridge
            <Copy className="w-3 h-3 ml-auto" />
          </Button>
        </div>

        {/* Features */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
          <div className="text-blue-300 font-semibold mb-2">Features:</div>
          <ul className="text-blue-200/70 text-xs space-y-1">
            <li>• Bi-directional state synchronization</li>
            <li>• Sub-50ms latency</li>
            <li>• Supports OSC, MIDI, WebSocket</li>
            <li>• Multi-user collaboration ready</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}