'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  CreditCard, 
  Clock, 
  Activity, 
  Search, 
  ShieldAlert, 
  Check, 
  X, 
  Shield, 
  Receipt, 
  Tag, 
  Plus, 
  Trash2,
  Sparkles, 
  Calendar,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'coupons'>('users');

  // Coupon Creation State
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, usersRes, couponsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
          fetch('/api/admin/coupons')
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (couponsRes.ok) {
          const cData = await couponsRes.json();
          setCoupons(cData.coupons || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && isSuperAdmin) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isSuperAdmin, authLoading]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDiscountValue) {
      toast.error('Please enter coupon code and discount value');
      return;
    }
    setCreatingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          discount_type: newDiscountType,
          discount_value: Number(newDiscountValue),
          max_uses: newMaxUses ? Number(newMaxUses) : null,
          expires_at: newExpiresAt || null,
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Coupon ${data.coupon.code} created successfully!`);
        setShowCreateCoupon(false);
        setNewCode('');
        setNewDiscountValue('');
        setNewMaxUses('');
        setNewExpiresAt('');
        fetchCoupons();
      } else {
        toast.error(data.error || 'Failed to create coupon');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating coupon');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon_id: string, current_active: boolean) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_id, is_active: !current_active })
      });
      if (res.ok) {
        toast.success(`Coupon status updated`);
        fetchCoupons();
      } else {
        toast.error('Failed to update coupon status');
      }
    } catch (err) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (coupon_id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon '${code}'?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon_id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(`Coupon '${code}' deleted`);
        fetchCoupons();
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleAction = async (user_id: string, action: string, plan_id?: string) => {
    if (!confirm(`Are you sure you want to perform this action (${action}${plan_id ? ` -> ${plan_id}` : ''})?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, action, plan_id })
      });
      
      if (res.ok) {
        toast.success(`Action ${action} successful`);
        // Refresh users & stats
        const [usersRes, statsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/stats')
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        const data = await res.json();
        toast.error(data.error || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    }
  };

  if (authLoading || loading) {
    return <div className="flex h-[50vh] items-center justify-center font-medium text-muted-foreground">Loading admin overview...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only platform administrators can access the admin dashboard.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase()) ||
    u.plan?.toLowerCase().includes(search.toLowerCase())
  );

  const transactions = stats?.recentTransactions || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <Shield className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Platform Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Master control room: Manage user subscriptions, feature access, payments and platform health.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'payments' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Payments ({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'coupons' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tag className="h-4 w-4 text-emerald-500" />
            <span>Coupons ({coupons.length})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 via-background to-transparent border-blue-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{stats.totalUsers}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Platform-wide registered profiles</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-transparent border-emerald-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Subscriptions</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-emerald-600">{stats.activeSubscriptions}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Paying business accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 via-background to-transparent border-amber-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">5-Day Trial Users</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-amber-600">{stats.trialUsers}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Full access trial active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 via-background to-transparent border-purple-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-600">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Payments collected via Razorpay</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'users' ? (
        <Card className="shadow-sm border-border/70">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Users & Subscription Management</CardTitle>
              <CardDescription>Grant plans, extend free trials, or toggle access for any tenant account.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user, email or plan..."
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="border-t border-border/70 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold text-xs">User / Email</TableHead>
                    <TableHead className="font-bold text-xs">Role</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs">Current Plan</TableHead>
                    <TableHead className="font-bold text-xs">Trial / Expiry</TableHead>
                    <TableHead className="font-bold text-xs">Set Plan</TableHead>
                    <TableHead className="text-right font-bold text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-28 text-muted-foreground text-sm">
                        No users found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isExpired = u.status === 'expired';
                      const isTrial = u.status === 'trial';
                      const isActive = u.status === 'active';
                      const isBlocked = u.status === 'blocked';

                      let expiryDisplay = 'No Expiry';
                      if (u.trial_ends_at) {
                        const d = new Date(u.trial_ends_at);
                        expiryDisplay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      }

                      return (
                        <TableRow key={u.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-semibold text-sm">{u.full_name || 'Anonymous User'}</div>
                            <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                          </TableCell>

                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-[11px] font-bold ${
                                u.role === 'Admin' ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' : 'border-slate-300 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {u.role}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge 
                              className={`text-[11px] font-bold ${
                                isActive ? 'bg-emerald-600 hover:bg-emerald-600 text-white' :
                                isBlocked ? 'bg-red-600 hover:bg-red-600 text-white' :
                                isTrial ? 'bg-amber-500 hover:bg-amber-500 text-white' :
                                'bg-slate-500 text-white'
                              }`}
                            >
                              {u.status || 'trial'}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span className="capitalize font-semibold text-xs text-foreground bg-muted/80 px-2 py-1 rounded border border-border/60">
                              {u.plan || (isTrial ? 'Full Trial' : 'None')}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-muted-foreground/70" />
                              <span>{expiryDisplay}</span>
                            </div>
                          </TableCell>

                          {/* Plan Switcher Dropdown */}
                          <TableCell>
                            <select
                              value={u.plan || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAction(u.user_id, 'change_plan', e.target.value);
                                }
                              }}
                              className="text-xs font-semibold bg-background border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">Change Plan...</option>
                              <option value="starter">Starter (₹10/mo)</option>
                              <option value="essential">Essential (₹999/mo)</option>
                              <option value="growth">Growth (₹1999/mo)</option>
                              <option value="allinone">All-In-One (₹3999/mo)</option>
                            </select>
                          </TableCell>

                          {/* Quick Action Buttons */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleAction(u.user_id, 'extend_trial')}
                                className="h-7 text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                title="Grant +7 days free trial"
                              >
                                +7d Trial
                              </Button>

                              {isBlocked ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAction(u.user_id, 'unblock')}
                                  className="h-7 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Check className="h-3 w-3 mr-1" /> Unblock
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAction(u.user_id, 'block')} 
                                  className="h-7 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3 mr-1" /> Block
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : activeTab === 'payments' ? (
        /* Payments & Transactions Tab */
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Customer Payments & Razorpay Orders</CardTitle>
            <CardDescription>Real-time audit log of all transactions and subscription purchases across the platform.</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="border-t border-border/70 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold text-xs">Customer Name & Email</TableHead>
                    <TableHead className="font-bold text-xs">Account</TableHead>
                    <TableHead className="font-bold text-xs">Plan / Description</TableHead>
                    <TableHead className="font-bold text-xs">Amount Paid</TableHead>
                    <TableHead className="font-bold text-xs">Reference (Razorpay ID)</TableHead>
                    <TableHead className="font-bold text-xs">Date & Time</TableHead>
                    <TableHead className="text-right font-bold text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-28 text-muted-foreground text-sm">
                        No transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx: any) => {
                      const dateFormatted = tx.created_at 
                        ? new Date(tx.created_at).toLocaleString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) 
                        : 'Recently';

                      return (
                        <TableRow key={tx.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-semibold text-sm">{tx.user_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{tx.user_email}</div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {tx.account_name}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs text-foreground">{tx.description}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="font-extrabold text-sm text-emerald-600">
                              ₹{Number(tx.amount || 0).toLocaleString()}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {tx.reference_id || 'Direct'}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {dateFormatted}
                          </TableCell>

                          <TableCell className="text-right">
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-bold">
                              Success (Paid)
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Discount Coupons Management Tab */
        <Card className="shadow-sm border-border/70">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-600" />
                <span>Platform Discount Coupons</span>
              </CardTitle>
              <CardDescription>Generate, manage and monitor promotional coupon codes applied by users on plan purchases.</CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateCoupon(!showCreateCoupon)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {showCreateCoupon ? 'Close Form' : 'Generate New Coupon'}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Create Coupon Form */}
            {showCreateCoupon && (
              <form onSubmit={handleCreateCoupon} className="p-5 rounded-2xl bg-muted/30 border border-emerald-500/20 space-y-4">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Create Promotional Coupon
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Coupon Code</label>
                    <Input 
                      placeholder="e.g. FESTIVE50" 
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="uppercase font-bold tracking-wider text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Discount Type</label>
                    <select
                      value={newDiscountType}
                      onChange={(e) => setNewDiscountType(e.target.value as any)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      Discount Value ({newDiscountType === 'percentage' ? '%' : '₹'})
                    </label>
                    <Input 
                      type="number"
                      placeholder={newDiscountType === 'percentage' ? "e.g. 10" : "e.g. 200"} 
                      value={newDiscountValue}
                      onChange={(e) => setNewDiscountValue(e.target.value)}
                      className="font-bold text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Max Uses (Optional)</label>
                    <Input 
                      type="number"
                      placeholder="e.g. 100 (Leave blank = unlimited)" 
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Expiry Date (Optional)</label>
                    <Input 
                      type="date"
                      value={newExpiresAt}
                      onChange={(e) => setNewExpiresAt(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateCoupon(false)}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={creatingCoupon}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-5"
                  >
                    {creatingCoupon ? 'Saving...' : 'Save & Active Coupon'}
                  </Button>
                </div>
              </form>
            )}

            {/* Coupons Table */}
            <div className="border border-border/70 rounded-xl overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold text-xs">Coupon Code</TableHead>
                    <TableHead className="font-bold text-xs">Discount Offer</TableHead>
                    <TableHead className="font-bold text-xs">Usage Counter</TableHead>
                    <TableHead className="font-bold text-xs">Expiry Date</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="text-right font-bold text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-28 text-muted-foreground text-sm">
                        No coupon codes created yet. Click "Generate New Coupon" to create your first code.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((c) => {
                      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;

                      return (
                        <TableRow key={c.id} className="hover:bg-muted/30">
                          <TableCell>
                            <span className="font-mono font-extrabold text-sm tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              {c.code}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-extrabold text-sm text-foreground">
                              {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {c.used_count || 0} / {c.max_uses ? c.max_uses : '∞ Unlimited'}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                          </TableCell>

                          <TableCell>
                            {isExpired ? (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px] font-bold">
                                Expired
                              </Badge>
                            ) : c.is_active ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-200 text-slate-600 text-[10px] font-bold">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleCoupon(c.id, c.is_active)}
                                className={`h-7 text-[11px] font-bold ${
                                  c.is_active 
                                    ? 'text-amber-600 hover:bg-amber-50' 
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {c.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCoupon(c.id, c.code)}
                                className="h-7 text-[11px] font-bold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
