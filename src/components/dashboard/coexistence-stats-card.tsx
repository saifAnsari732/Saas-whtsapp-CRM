import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, MessageSquare } from 'lucide-react';

export function CoexistenceStatsCard() {
  const [stats, setStats] = useState<{ status: string; chatCount: number } | null>(null);
  
  useEffect(() => {
    fetch('/api/whatsapp/baileys/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data);
        }
      });
  }, []);

  if (!stats) return null;

  return (
    <Card className="col-span-full xl:col-span-1 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          Coexistence (Web) Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold">
            {stats.status === 'connected' ? (
              <span className="text-green-500">Connected</span>
            ) : (
              <span className="text-yellow-600 capitalize">{stats.status}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>{stats.chatCount} Synced Chats</span>
        </div>
      </CardContent>
    </Card>
  );
}
