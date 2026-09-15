"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, MessageSquare, Shield, Activity, ArrowRight, Settings } from 'lucide-react'
import Link from 'next/link'
import { loadTeamActivity, type TeamMemberActivity } from '@/lib/dashboard/team-queries'

export function TeamActivityCard() {
  const { accountId, isAdmin, isOwner } = useAuth()
  const [team, setTeam] = useState<TeamMemberActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) return;
    const db = createClient()
    loadTeamActivity(db, accountId)
      .then(data => setTeam(data))
      .catch(err => console.error('Failed to load team activity:', err))
      .finally(() => setLoading(false))
  }, [accountId])

  if (!isOwner) return null;

  return (
    <Card className="col-span-full mt-6 shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-indigo-500" />
              Team Management & Activity
            </CardTitle>
            <CardDescription className="mt-1">
              Manage your team members and view their recent activity across the platform.
            </CardDescription>
          </div>
          <Link href="/settings?tab=team" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">
            <Settings className="h-4 w-4" />
            Manage Team
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading team activity...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-white dark:bg-slate-950 border-b dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Team Member</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Recent Activity (7d)</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {team.map((member, i) => (
                  <tr key={i} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                            {member.full_name?.charAt(0) || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{member.full_name || 'Unnamed User'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className={
                        member.account_role === 'owner' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        member.account_role === 'admin' ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100" :
                        "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }>
                        {member.account_role || member.role || 'User'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">{member.messagesSent}</span> messages sent
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href="/settings?tab=team" className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {team.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No team members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
