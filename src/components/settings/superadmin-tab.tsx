'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  ShieldAlert, 
  Loader2, 
  UserX, 
  UserCheck, 
  Shield,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SettingsPanelHead } from './settings-panel-head';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AdminUser {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  isBanned: boolean;
  lastSignInAt: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function SuperAdminTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        if (res.status === 403) {
          toast.error('You do not have Super Admin permissions.');
        } else {
          toast.error('Failed to load users');
        }
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('[SuperAdminTab] load error:', err);
      toast.error('Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleAction = async (targetUserId: string, action: 'ban' | 'unban') => {
    if (targetUserId === user?.id) {
      toast.error("You cannot block yourself.");
      return;
    }
    
    const confirmMessage = action === 'ban' 
      ? 'Are you sure you want to block this user? They will not be able to log in.' 
      : 'Are you sure you want to unblock this user?';
      
    if (!window.confirm(confirmMessage)) return;

    setPendingAction(targetUserId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, action }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Failed to perform action');
        return;
      }
      
      toast.success(data.message);
      
      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === targetUserId 
            ? { ...u, isBanned: action === 'ban' } 
            : u
        )
      );
    } catch (err) {
      console.error('[SuperAdminTab] action error:', err);
      toast.error('Could not reach the server');
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteUser = async (targetUserId: string, userEmail: string | null) => {
    if (targetUserId === user?.id) {
      toast.error("You cannot delete your own account from here.");
      return;
    }
    
    const confirmMessage = `WARNING: Are you absolutely sure you want to permanently delete ${userEmail || 'this user'} and all their data? This action cannot be undone.`;
      
    if (!window.confirm(confirmMessage)) return;

    setPendingAction(`delete_${targetUserId}`);
    try {
      const res = await fetch(`/api/admin/users?userId=${targetUserId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user');
        return;
      }
      
      toast.success(data.message || 'User permanently deleted');
      
      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
    } catch (err) {
      console.error('[SuperAdminTab] delete error:', err);
      toast.error('Could not reach the server');
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  // Quick fallback if non-admin renders it despite tab hiding
  if (!user || (user.email !== 'kisandeveloper2@gmail.com' && !users.length)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldAlert className="size-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          This section is strictly restricted to platform owners and super administrators.
        </p>
      </div>
    );
  }

  return (
    <section className="animate-in fade-in-50 space-y-6 duration-200">
      <SettingsPanelHead
        title="Platform Admin"
        description="Manage all users registered on the SaaS platform."
        action={
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 uppercase tracking-widest text-[10px]">
            <Shield className="size-3 mr-1" /> Super Admin
          </Badge>
        }
      />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{users.length}</span> total users registered.
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {users.map((member) => {
              const isSelf = member.id === user?.id;
              const isBusy = pendingAction === member.id;

              return (
                <li
                  key={member.id}
                  className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${member.isBanned ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Avatar className={`size-9 shrink-0 ${member.isBanned ? 'grayscale opacity-50' : ''}`}>
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={member.fullName || 'User'} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                        {(member.fullName || member.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`truncate text-sm font-medium ${member.isBanned ? 'text-red-700/70 dark:text-red-400/70 line-through' : 'text-foreground'}`}>
                          {member.fullName || 'Unnamed User'}
                        </span>
                        {isSelf && (
                          <Badge className="bg-muted text-muted-foreground border-border text-[10px] uppercase tracking-wide">
                            You
                          </Badge>
                        )}
                        {member.isBanned && (
                          <Badge variant="destructive" className="text-[10px] uppercase h-5">
                            Blocked
                          </Badge>
                        )}
                      </div>
                      {member.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block text-right text-xs text-muted-foreground w-28 shrink-0">
                    <div>Joined</div>
                    <div className="font-medium text-foreground">{fmtDate(member.createdAt)}</div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {!isSelf && (
                      member.isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(member.id, 'unban')}
                          disabled={isBusy}
                          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        >
                          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4 mr-1.5" />}
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(member.id, 'ban')}
                          disabled={isBusy}
                          className="border-red-500/40 bg-red-500/10 text-red-600 hover:bg-red-500/20"
                        >
                          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4 mr-1.5" />}
                          Block User
                        </Button>
                      )
                    )}
                    
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(member.id, member.email)}
                        disabled={pendingAction === `delete_${member.id}` || isBusy}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
                        title="Delete User Permanently"
                      >
                        {pendingAction === `delete_${member.id}` ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
