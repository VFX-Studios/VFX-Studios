import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const eventTypeColors = {
  preset_load: '#f5a623',
  effect_change: '#00d4ff',
  layer_change: '#8b5cf6',
  color_shift: '#e91e8c',
  camera_switch: '#10b981',
  transition: '#6366f1',
};

export default function TimelineEditor({ song, currentTime, onSeek, presets }) {
  const [newEvent, setNewEvent] = useState({
    event_type: 'preset_load',
    timestamp_seconds: 0,
    duration_seconds: 1,
    preset_id: '',
  });
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['timeline-events', song?.id],
    queryFn: () => song?.id 
      ? base44.entities.TimelineEvent.filter({ song_id: song.id }, 'timestamp_seconds')
      : [],
    enabled: !!song?.id,
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.TimelineEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-events'] });
      toast.success('Event added');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.TimelineEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-events'] });
      toast.success('Event deleted');
    },
  });

  const toggleEventMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.TimelineEvent.update(id, { is_active: !is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline-events'] }),
  });

  const addEvent = () => {
    if (!song) return;
    createEventMutation.mutate({
      song_id: song.id,
      ...newEvent,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const songDuration = song?.duration_seconds || 300;
  
  if (!song) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <p className="text-white/40 text-sm">Select a song to edit timeline</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/80 font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#f5a623]" />
          Timeline Automation
        </h3>
      </div>

      {/* Timeline visualization */}
      <div className="relative h-24 bg-black/30 rounded-lg mb-4 overflow-hidden">
        {/* Progress indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#f5a623] z-10"
          style={{ left: `${(currentTime / songDuration) * 100}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#f5a623] shadow-lg" />
        </div>

        {/* Time markers */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[9px] text-white/30">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i}>{formatTime((songDuration / 10) * i)}</span>
          ))}
        </div>

        {/* Events */}
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 h-16 cursor-pointer group"
            style={{
              left: `${(event.timestamp_seconds / songDuration) * 100}%`,
              width: `${Math.max((event.duration_seconds / songDuration) * 100, 1)}%`,
            }}
            onClick={() => onSeek?.(event.timestamp_seconds)}
          >
            <div
              className={`h-full rounded border-2 ${event.is_active ? 'opacity-100' : 'opacity-30'}`}
              style={{
                backgroundColor: `${eventTypeColors[event.event_type]}20`,
                borderColor: eventTypeColors[event.event_type],
              }}
            >
              <div className="px-1 py-0.5 text-[8px] font-medium truncate" style={{ color: eventTypeColors[event.event_type] }}>
                {event.event_type.replace('_', ' ')}
              </div>
            </div>
            <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap pointer-events-none">
              {formatTime(event.timestamp_seconds)} - {event.event_type.replace('_', ' ')}
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 ml-2 text-red-400 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEventMutation.mutate(event.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add new event */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-white/60 text-xs">Event Type</Label>
            <Select value={newEvent.event_type} onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preset_load">Load Preset</SelectItem>
                <SelectItem value="effect_change">Effect Change</SelectItem>
                <SelectItem value="layer_change">Layer Change</SelectItem>
                <SelectItem value="color_shift">Color Shift</SelectItem>
                <SelectItem value="camera_switch">Camera Switch</SelectItem>
                <SelectItem value="transition">Transition</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Time (seconds)</Label>
            <Input
              type="number"
              value={newEvent.timestamp_seconds}
              onChange={(e) => setNewEvent({ ...newEvent, timestamp_seconds: parseFloat(e.target.value) })}
              className="bg-white/5 border-white/10 text-white text-xs h-8 mt-1"
            />
          </div>
        </div>

        {newEvent.event_type === 'preset_load' && (
          <div>
            <Label className="text-white/60 text-xs">Preset</Label>
            <Select value={newEvent.preset_id} onValueChange={(v) => setNewEvent({ ...newEvent, preset_id: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8 mt-1">
                <SelectValue placeholder="Select preset..." />
              </SelectTrigger>
              <SelectContent>
                {presets?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-white/60 text-xs">Duration (seconds)</Label>
          <Input
            type="number"
            step="0.1"
            value={newEvent.duration_seconds}
            onChange={(e) => setNewEvent({ ...newEvent, duration_seconds: parseFloat(e.target.value) })}
            className="bg-white/5 border-white/10 text-white text-xs h-8 mt-1"
          />
        </div>

        <Button onClick={addEvent} className="w-full h-8 bg-[#f5a623] hover:bg-[#e91e8c] text-xs">
          <Plus className="w-3 h-3 mr-2" />
          Add Timeline Event
        </Button>
      </div>
    </div>
  );
}