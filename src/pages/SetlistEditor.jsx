import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import CollaborativePlaylistEditor from '@/components/features/CollaborativePlaylistEditor';

export default function SetlistEditor() {
  const [user, setUser] = useState(null);
  const [setlistId, setSetlistId] = useState(null);
  const [setlistName, setSetlistName] = useState('');
  const [festival, setFestival] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSetlistId(params.get('id'));
    base44.auth.me().then(setUser);
  }, []);

  const { data: setlist } = useQuery({
    queryKey: ['setlist', setlistId],
    queryFn: async () => {
      const s = await base44.entities.Setlist.list();
      const found = s.find(x => x.id === setlistId);
      if (found) {
        setSetlistName(found.name);
        setFestival(found.festival_name || '');
      }
      return found;
    },
    enabled: !!setlistId,
  });

  const { data: setlistSongs = [] } = useQuery({
    queryKey: ['setlist-songs', setlistId],
    queryFn: () => base44.entities.SetlistSong.filter({ setlist_id: setlistId }, 'position'),
    enabled: !!setlistId,
  });

  const { data: userSongs = [] } = useQuery({
    queryKey: ['user-songs', user?.id],
    queryFn: () => base44.entities.UserSong.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const updateSetlistMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Setlist.update(id, data),
    onSuccess: () => toast.success('Setlist updated'),
  });

  const addSongMutation = useMutation({
    mutationFn: (data) => base44.entities.SetlistSong.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist-songs'] });
      toast.success('Song added');
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: (id) => base44.entities.SetlistSong.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlist-songs'] });
      toast.success('Song removed');
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: ({ id, position }) => base44.entities.SetlistSong.update(id, { position }),
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(setlistSongs);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    items.forEach((item, index) => {
      updatePositionMutation.mutate({ id: item.id, position: index + 1 });
    });
  };

  const handleAddSong = (songId) => {
    addSongMutation.mutate({
      setlist_id: setlistId,
      user_song_id: songId,
      position: setlistSongs.length + 1,
      set_section: 'build'
    });
  };

  const handleSaveMetadata = () => {
    updateSetlistMutation.mutate({
      id: setlistId,
      data: { name: setlistName, festival_name: festival }
    });
  };

  const getSongDetails = (userSongId) => {
    return userSongs.find(s => s.id === userSongId);
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-6 text-white/60">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <Input
              value={setlistName}
              onChange={(e) => setSetlistName(e.target.value)}
              className="text-2xl font-light bg-transparent border-none text-white p-0 h-auto"
              placeholder="Setlist name..."
            />
          </div>
          <Input
            value={festival}
            onChange={(e) => setFestival(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Festival / Venue name..."
          />
          <Button onClick={handleSaveMetadata} className="mt-4 bg-[#f5a623]">
            <Save className="w-4 h-4 mr-2" />
            Save Details
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setlist */}
          <div className="lg:col-span-2">
            <h2 className="text-white/80 font-medium mb-4">Setlist Order</h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="setlist">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {setlistSongs.map((item, index) => {
                      const song = getSongDetails(item.user_song_id);
                      if (!song) return null;

                      return (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-white/5 rounded-lg border border-white/10 p-4 flex items-center gap-3"
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-5 h-5 text-white/30" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-white font-medium">{song.title}</h3>
                                <div className="flex gap-2 mt-1">
                                  {song.ai_suggested_section && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#f5a623]/20 text-[#f5a623]">
                                      {song.ai_suggested_section}
                                    </span>
                                  )}
                                  <span className="text-white/40 text-xs">{song.duration}</span>
                                </div>
                              </div>
                              <Select
                                value={item.set_section}
                                onValueChange={(v) =>
                                  base44.entities.SetlistSong.update(item.id, { set_section: v })
                                }
                              >
                                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="opener">Opener</SelectItem>
                                  <SelectItem value="build">Build</SelectItem>
                                  <SelectItem value="peak">Peak</SelectItem>
                                  <SelectItem value="cooldown">Cooldown</SelectItem>
                                  <SelectItem value="closer">Closer</SelectItem>
                                  <SelectItem value="encore">Encore</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteSongMutation.mutate(item.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Available Songs */}
          <div>
            <div className="mb-6">
              <CollaborativePlaylistEditor setlistId={setlistId} />
            </div>
            
            <h2 className="text-white/80 font-medium mb-4">Available Songs</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {userSongs
                .filter(s => !setlistSongs.some(ss => ss.user_song_id === s.id))
                .map(song => (
                  <div
                    key={song.id}
                    className="bg-white/5 rounded-lg border border-white/10 p-3 hover:border-[#f5a623]/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium">{song.title}</h4>
                        <div className="flex gap-1 mt-1">
                          {song.ai_suggested_section && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f5a623]/20 text-[#f5a623]">
                              {song.ai_suggested_section}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        onClick={() => handleAddSong(song.id)}
                        className="h-8 w-8 bg-[#f5a623] hover:bg-[#e91e8c]"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}