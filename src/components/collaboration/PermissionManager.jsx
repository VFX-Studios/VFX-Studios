import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const permissionLevels = [
  { value: 'view_only', label: 'View Only', color: 'bg-gray-500/20 text-gray-300' },
  { value: 'suggest_only', label: 'Suggest Only', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'effects_control', label: 'Effects Control', color: 'bg-purple-500/20 text-purple-300' },
  { value: 'layers_control', label: 'Layers Control', color: 'bg-pink-500/20 text-pink-300' },
  { value: 'full_control', label: 'Full Control', color: 'bg-green-500/20 text-green-300' }
];

export default function PermissionManager({ sessionId, isHost }) {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState(null);

  const { data: session } = useQuery({
    queryKey: ['vj-session', sessionId],
    queryFn: () => base44.entities.VJSession.filter({ id: sessionId }).then(s => s[0])
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['collaborator-permissions', sessionId],
    queryFn: () => base44.entities.CollaboratorPermission.filter({ session_id: sessionId }),
    enabled: !!sessionId
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ permissionId, level }) =>
      base44.entities.CollaboratorPermission.update(permissionId, {
        permission_level: level
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-permissions'] });
      setEditingUser(null);
    }
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data) => base44.entities.CollaboratorPermission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-permissions'] });
    }
  });

  if (!isHost) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/40 to-black/40 border-white/10">
        <CardContent className="pt-6 text-center">
          <Shield className="w-8 h-8 text-white/40 mx-auto mb-2" />
          <p className="text-white/60 text-sm">Only the host can manage permissions</p>
        </CardContent>
      </Card>
    );
  }

  const collaborators = session?.collaborators || [];

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-400/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Collaborator Permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {collaborators.map(userId => {
            const permission = permissions.find(p => p.user_id === userId);
            const level = permission?.permission_level || 'view_only';
            const levelInfo = permissionLevels.find(l => l.value === level);

            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className="text-white/90 text-sm">{userId.slice(0, 8)}...</span>
                  </div>
                  <Badge className={levelInfo?.color}>
                    {levelInfo?.label}
                  </Badge>
                </div>

                {editingUser === userId ? (
                  <div className="flex gap-2 mt-2">
                    <Select
                      defaultValue={level}
                      onValueChange={(value) =>
                        permission
                          ? updatePermissionMutation.mutate({ permissionId: permission.id, level: value })
                          : createPermissionMutation.mutate({
                              session_id: sessionId,
                              user_id: userId,
                              permission_level: value,
                              granted_by: session.host_user_id
                            })
                      }
                    >
                      <SelectTrigger className="flex-1 bg-black/30 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingUser(null)}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingUser(userId)}
                    className="w-full mt-2 border-white/20 text-white/80"
                  >
                    Change Permission
                  </Button>
                )}
              </motion.div>
            );
          })}

          {collaborators.length === 0 && (
            <div className="text-center text-white/40 text-sm py-4">
              No collaborators yet. Share your session code!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}