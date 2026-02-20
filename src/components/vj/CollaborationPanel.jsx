import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Hand, MessageSquare, Send, Check, X, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CollaborationPanel({ sessionId, currentUserId, isController, currentState, onSuggestChange, currentTime }) {
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [suggestionMode, setSuggestionMode] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['vj-session', sessionId],
    queryFn: async () => {
      const sessions = await base44.entities.VJSession.list();
      return sessions.find(s => s.id === sessionId);
    },
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['session-messages', sessionId],
    queryFn: () => base44.entities.SessionMessage.filter({ session_id: sessionId }, 'created_date'),
    enabled: !!sessionId,
    refetchInterval: 1000,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ['vj-suggestions', sessionId],
    queryFn: () => base44.entities.VJSuggestion.filter({ session_id: sessionId, status: 'pending' }),
    enabled: !!sessionId && isController,
    refetchInterval: 1000,
  });

  const { data: annotations = [] } = useQuery({
    queryKey: ['timeline-annotations', sessionId],
    queryFn: () => base44.entities.TimelineAnnotation.filter({ session_id: sessionId }),
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.SessionMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-messages'] });
      setMessage('');
    },
  });

  const createSuggestionMutation = useMutation({
    mutationFn: (data) => base44.entities.VJSuggestion.create(data),
    onSuccess: () => toast.success('Suggestion sent'),
  });

  const respondToSuggestionMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.VJSuggestion.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vj-suggestions'] });
      toast.success('Suggestion processed');
    },
  });

  const requestControlMutation = useMutation({
    mutationFn: () => base44.entities.VJSession.update(sessionId, { current_controller_id: currentUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vj-session'] });
      toast.success('Control transferred');
    },
  });

  const handleSendMessage = (e, timestamp) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      session_id: sessionId,
      user_id: currentUserId,
      message: message.trim(),
      timestamp_seconds: timestamp || 0,
      is_annotation: !!timestamp,
    });
    
    // If annotation mode, also create timeline annotation
    if (annotationMode && timestamp) {
      base44.entities.TimelineAnnotation.create({
        session_id: sessionId,
        user_id: currentUserId,
        timestamp_seconds: timestamp,
        annotation_type: 'note',
        content: message.trim(),
        color: '#f5a623'
      }).then(() => queryClient.invalidateQueries({ queryKey: ['timeline-annotations'] }));
    }
  };

  const handleTransferControl = (targetUserId) => {
    base44.entities.VJSession.update(sessionId, {
      current_controller_id: targetUserId
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['vj-session'] });
      toast.success('Control transferred');
    });
  };

  const collaboratorCount = session?.collaborators?.length || 0;
  const isLive = session?.is_live;

  return (
    <div className="space-y-4">
      {/* Session Info */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white/80 text-sm font-medium">Collaborative Session</span>
            {isLive && (
              <Badge className="bg-red-500 text-white text-[10px] flex items-center gap-1">
                <Radio className="w-2 h-2 animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-purple-400 border-purple-400/30">
            {collaboratorCount + 1} VJs
          </Badge>
        </div>

        <div className="text-xs text-white/40 mb-3">
          Session Code: <span className="text-purple-400 font-mono">{session?.session_code}</span>
        </div>

        <div className="flex gap-2">
          {!isController ? (
            <>
              <Button
                size="sm"
                onClick={() => requestControlMutation.mutate()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs"
              >
                <Hand className="w-3 h-3 mr-2" />
                Request Control
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSuggestionMode(!suggestionMode)}
                className="border-yellow-400/30 text-yellow-400 text-xs"
              >
                {suggestionMode ? 'Suggest ON' : 'Suggest'}
              </Button>
            </>
          ) : (
            <Badge className="flex-1 justify-center bg-green-500/20 text-green-400 border-green-400/30">
              You have control
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowChat(!showChat)}
            className="border-purple-400/30 text-purple-400"
          >
            <MessageSquare className="w-3 h-3" />
            {annotations.length > 0 && (
              <span className="ml-1 text-[8px]">{annotations.length}</span>
            )}
          </Button>
        </div>
      </div>

      {/* Suggestion Mode Banner */}
      {suggestionMode && !isController && (
        <div className="bg-yellow-900/20 rounded-xl border border-yellow-500/30 p-3">
          <div className="text-yellow-400 text-xs font-medium mb-2">Suggestion Mode Active</div>
          <p className="text-white/40 text-[10px]">Your changes will be sent as suggestions to the controller</p>
        </div>
      )}

      {/* Pending Suggestions (for controller) */}
      {isController && suggestions.length > 0 && (
        <div className="bg-yellow-900/20 rounded-xl border border-yellow-500/20 p-4">
          <h3 className="text-yellow-400 text-sm font-medium mb-3 flex items-center gap-2">
            <Hand className="w-4 h-4" />
            Pending Suggestions ({suggestions.length})
          </h3>
          <div className="space-y-2">
            {suggestions.map(sug => (
              <div key={sug.id} className="bg-black/20 rounded-lg p-3 text-xs">
                <div className="text-white/60 mb-2">
                  {sug.suggestion_type.replace('_', ' ')} change
                </div>
                {sug.message && (
                  <div className="text-white/40 mb-2 italic">"{sug.message}"</div>
                )}
                {sug.parameters && (
                  <div className="bg-white/5 rounded p-2 mb-2 text-[10px] text-white/40 max-h-20 overflow-y-auto">
                    {JSON.stringify(sug.parameters, null, 2)}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      respondToSuggestionMutation.mutate({ id: sug.id, status: 'accepted' });
                      if (sug.parameters && onSuggestChange) {
                        onSuggestChange(sug.parameters);
                      }
                    }}
                    className="h-7 flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondToSuggestionMutation.mutate({ id: sug.id, status: 'rejected' })}
                    className="h-7 flex-1 border-red-400/30 text-red-400"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/40 rounded-xl border border-white/10 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/80 text-sm font-medium">Team Chat & Annotations</h3>
                <div className="flex items-center gap-1">
                  <span className="text-white/40 text-[9px]">Pin to timeline</span>
                  <Switch
                    checked={annotationMode}
                    onCheckedChange={setAnnotationMode}
                    className="scale-75"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`text-xs p-2 rounded ${
                      msg.is_annotation ? 'border-l-2 border-yellow-400' : ''
                    } ${
                      msg.user_id === currentUserId
                        ? 'bg-purple-600/20 text-purple-200 ml-8'
                        : 'bg-white/5 text-white/60 mr-8'
                    }`}
                  >
                    {msg.is_annotation && (
                      <div className="text-yellow-400 text-[9px] mb-1">
                        @{Math.floor(msg.timestamp_seconds / 60)}:{(msg.timestamp_seconds % 60).toFixed(0).padStart(2, '0')}
                      </div>
                    )}
                    {msg.message}
                  </div>
                ))}
              </div>
              <form onSubmit={(e) => handleSendMessage(e, annotationMode ? currentTime : null)} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={annotationMode ? "Add timeline marker..." : "Send message..."}
                  className="bg-white/5 border-white/10 text-white text-xs h-8"
                />
                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 px-3">
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}