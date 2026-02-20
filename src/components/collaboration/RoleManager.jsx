import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Crown, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const roleIcons = {
  host: Crown,
  co_vj: Shield,
  moderator: Users,
  viewer: Eye,
};

const roleDescriptions = {
  host: 'Full control over session, can manage all collaborators',
  co_vj: 'Control layers, effects, camera, and particles',
  moderator: 'Manage chat, whiteboard, and kick users',
  viewer: 'View only, can send suggestions',
};

const defaultPermissions = {
  host: {
    control_layers: true,
    control_effects: true,
    control_camera: true,
    control_particles: true,
    manage_presets: true,
    manage_timeline: true,
    manage_chat: true,
    manage_whiteboard: true,
    send_suggestions: true,
    kick_users: true,
  },
  co_vj: {
    control_layers: true,
    control_effects: true,
    control_camera: true,
    control_particles: true,
    manage_presets: true,
    manage_timeline: false,
    manage_chat: false,
    manage_whiteboard: true,
    send_suggestions: true,
    kick_users: false,
  },
  moderator: {
    control_layers: false,
    control_effects: false,
    control_camera: false,
    control_particles: false,
    manage_presets: false,
    manage_timeline: false,
    manage_chat: true,
    manage_whiteboard: true,
    send_suggestions: true,
    kick_users: true,
  },
  viewer: {
    control_layers: false,
    control_effects: false,
    control_camera: false,
    control_particles: false,
    manage_presets: false,
    manage_timeline: false,
    manage_chat: false,
    manage_whiteboard: false,
    send_suggestions: true,
    kick_users: false,
  },
};

export default function RoleManager({ sessionId, currentUser, isHost }) {
  const [editingRole, setEditingRole] = useState(null);
  const [customPermissions, setCustomPermissions] = useState({});
  const queryClient = useQueryClient();

  const { data: collaboratorRoles = [] } = useQuery({
    queryKey: ['collaborator-roles', sessionId],
    queryFn: () => base44.entities.CollaboratorRole.filter({ session_id: sessionId }),
    refetchInterval: 3000,
  });

  const assignRoleMutation = useMutation({
    mutationFn: (data) => base44.entities.CollaboratorRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-roles'] });
      toast.success('Role assigned');
      setEditingRole(null);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CollaboratorRole.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-roles'] });
      toast.success('Role updated');
      setEditingRole(null);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.CollaboratorRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-roles'] });
      toast.success('Role removed');
    },
  });

  const handleRoleChange = (userId, newRole) => {
    const existing = collaboratorRoles.find(r => r.user_id === userId);
    const permissions = customPermissions[userId] || defaultPermissions[newRole];

    if (existing) {
      updateRoleMutation.mutate({
        id: existing.id,
        data: { role: newRole, permissions },
      });
    } else {
      assignRoleMutation.mutate({
        session_id: sessionId,
        user_id: userId,
        role: newRole,
        permissions,
        granted_by: currentUser.id,
        granted_at: new Date().toISOString(),
      });
    }
  };

  const handlePermissionToggle = (userId, permission) => {
    const role = collaboratorRoles.find(r => r.user_id === userId);
    if (!role) return;

    const newPermissions = {
      ...role.permissions,
      [permission]: !role.permissions[permission],
    };

    setCustomPermissions(prev => ({ ...prev, [userId]: newPermissions }));
    updateRoleMutation.mutate({
      id: role.id,
      data: { permissions: newPermissions },
    });
  };

  if (!isHost) {
    const myRole = collaboratorRoles.find(r => r.user_id === currentUser.id);
    return (
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          {myRole && React.createElement(roleIcons[myRole.role] || Eye, {
            className: "w-5 h-5 text-[#f5a623]"
          })}
          <h3 className="text-white font-medium">Your Role: {myRole?.role || 'Viewer'}</h3>
        </div>
        <p className="text-white/60 text-sm">
          {myRole ? roleDescriptions[myRole.role] : 'You can view and send suggestions'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Collaborator Roles</h3>
        <span className="text-white/40 text-sm">{collaboratorRoles.length} assigned</span>
      </div>

      <div className="space-y-2">
        {collaboratorRoles.map(role => {
          const RoleIcon = roleIcons[role.role] || Eye;
          return (
            <div
              key={role.id}
              className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RoleIcon className="w-4 h-4 text-[#f5a623]" />
                  <span className="text-white text-sm">{role.user_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingRole(role)}
                        className="h-7 px-2 text-white/60"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">Edit Role & Permissions</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white/70 mb-2">Role</Label>
                          <Select
                            value={role.role}
                            onValueChange={(val) => handleRoleChange(role.user_id, val)}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(roleDescriptions).map(r => (
                                <SelectItem key={r} value={r}>
                                  {r.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-white/70">Custom Permissions</Label>
                          {Object.keys(role.permissions).map(perm => (
                            <div key={perm} className="flex items-center justify-between">
                              <span className="text-white/60 text-sm">
                                {perm.replace(/_/g, ' ')}
                              </span>
                              <Switch
                                checked={role.permissions[perm]}
                                onCheckedChange={() => handlePermissionToggle(role.user_id, perm)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRoleMutation.mutate(role.id)}
                    className="h-7 px-2 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded bg-[#f5a623]/20 text-[#f5a623]">
                  {role.role.replace('_', ' ')}
                </span>
                {Object.entries(role.permissions)
                  .filter(([_, enabled]) => enabled)
                  .slice(0, 3)
                  .map(([perm]) => (
                    <span key={perm} className="text-[10px] text-white/40">
                      {perm.replace(/control_|manage_/g, '')}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}