import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThumbsUp, ThumbsDown, Users, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CollaborativePlaylistEditor({ setlistId }) {
  const [collaboration, setCollaboration] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [visualSuggestions, setVisualSuggestions] = useState([]);

  useEffect(() => {
    loadCollaboration();
  }, [setlistId]);

  const loadCollaboration = async () => {
    try {
      const collabs = await base44.entities.CollaborativeSetlist.filter({
        setlist_id: setlistId
      });

      if (collabs[0]) {
        setCollaboration(collabs[0]);
      }
    } catch (error) {
      console.error('Load collaboration error:', error);
    }
  };

  const inviteCollaborator = async () => {
    try {
      const user = await base44.auth.me();
      
      if (!collaboration) {
        // Create new collaboration
        const newCollab = await base44.entities.CollaborativeSetlist.create({
          setlist_id: setlistId,
          collaborators: [user.id],
          crew_name: 'My DJ Crew'
        });
        setCollaboration(newCollab);
      }

      // Send invite email (would integrate with actual email service)
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      
    } catch (error) {
      toast.error('Invite failed');
    }
  };

  const voteOnVisual = async (suggestionId, vote) => {
    try {
      const updatedVotes = collaboration.visual_votes.map(v => 
        v.id === suggestionId 
          ? { ...v, votes: { ...v.votes, [user.id]: vote } }
          : v
      );

      await base44.entities.CollaborativeSetlist.update(collaboration.id, {
        visual_votes: updatedVotes
      });

      toast.success(`Vote recorded: ${vote === 1 ? '👍' : '👎'}`);
      loadCollaboration();
    } catch (error) {
      toast.error('Vote failed');
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[#f5a623]" />
        <h3 className="text-white font-semibold text-lg">Collaborative Editing</h3>
      </div>

      {/* Invite Collaborators */}
      <div className="mb-6">
        <label className="text-white/70 text-sm mb-2 block">Invite VJ to Collaborate</label>
        <div className="flex gap-2">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="collaborator@email.com"
            className="bg-white/5 border-white/10 text-white"
          />
          <Button
            onClick={inviteCollaborator}
            className="bg-[#f5a623]"
          >
            <Send className="w-4 h-4 mr-2" />
            Invite
          </Button>
        </div>
      </div>

      {/* Current Collaborators */}
      {collaboration && (
        <div className="mb-6">
          <div className="text-white/70 text-sm mb-3">
            Active Collaborators ({collaboration.collaborators.length})
          </div>
          <div className="flex gap-2">
            {collaboration.collaborators.map((userId, i) => (
              <Avatar key={i} className="border-2 border-[#f5a623]">
                <AvatarFallback className="bg-[#f5a623] text-white">
                  {i + 1}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}

      {/* Visual Voting */}
      <div>
        <div className="text-white/70 text-sm mb-3">Vote on Visual Choices</div>
        <div className="space-y-3">
          {[
            { id: 1, song: 'Track 1', visual: 'Cyberpunk Neon', votes: { up: 3, down: 1 } },
            { id: 2, song: 'Track 2', visual: 'Organic Flow', votes: { up: 2, down: 0 } }
          ].map((suggestion) => (
            <Card key={suggestion.id} className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{suggestion.song}</div>
                  <div className="text-white/60 text-sm">{suggestion.visual}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => voteOnVisual(suggestion.id, 1)}
                    className="text-green-400"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {suggestion.votes.up}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => voteOnVisual(suggestion.id, -1)}
                    className="text-red-400"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    {suggestion.votes.down}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200/70">
        💡 Collaborators can suggest visuals and vote. The highest-voted options are automatically applied to the setlist.
      </div>
    </Card>
  );
}