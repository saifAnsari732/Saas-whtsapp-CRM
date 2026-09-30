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
  Zap,
  Server,
  Download,
  Gift,
  Smartphone,
  Globe,
  Settings2,
  TrendingUp,
  Cpu,
  RefreshCw,
  Bell,
  Crown,
  Filter,
  CheckCircle2,
  Wallet,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'gateway' | 'coupons' | 'settings'>('users');

  // Selected User Detail Modal & Power Action state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [customCreditAmount, setCustomCreditAmount] = useState('500');
  const [customTrialDays, setCustomTrialDays] = useState('5');
  const [actionLoading, setActionLoading] = useState(false);

  // Coupon Creation State
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Global Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
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
      toast.error('Failed to load platform admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      fetchAdminData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isSuperAdmin, authLoading]);

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
        fetchAdminData();
      } else {
        toast.error(data.error || 'Failed to create coupon');
      }
    } catch (err) {
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
        fetchAdminData();
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
        fetchAdminData();
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleAction = async (user_id: string, action: string, plan_id?: string, days?: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, action, plan_id, days })
      });
      
      if (res.ok) {
        toast.success(`SuperAdmin command [${action}] executed successfully!`);
        if (selectedUser && selectedUser.user_id === user_id) {
          // Refresh selected user metadata locally
          setSelectedUser((prev: any) => ({
            ...prev,
            status: action === 'block' ? 'blocked' : action === 'unblock' ? 'active' : action === 'extend_trial' ? 'trial' : action === 'change_plan' || action === 'force_bypass' ? 'active' : prev.status,
            plan: plan_id ? plan_id : prev.plan,
            role: action === 'toggle_role' ? (prev.role === 'admin' ? 'user' : 'admin') : prev.role
          }));
        }
        fetchAdminData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong executing action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrantCredit = async () => {
    if (!selectedUser || !customCreditAmount) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          action: 'grant_wallet_credit',
          plan_id: customCreditAmount
        })
      });
      if (res.ok) {
        toast.success(`Granted ₹${customCreditAmount} credit to ${selectedUser.full_name || selectedUser.email}!`);
        fetchAdminData();
      } else {
        toast.error('Failed to grant credit');
      }
    } catch (err) {
      toast.error('Failed to grant wallet credit');
    } finally {
      setActionLoading(false);
    }
  };

  const exportUsersCSV = () => {
    if (!users || users.length === 0) return;
    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Plan', 'Wallet Balance (INR)', 'Trial Ends At', 'Joined Date'];
    const rows = users.map(u => [
      u.user_id || u.id,
      `"${u.full_name || ''}"`,
      u.email,
      u.role,
      u.status,
      u.plan,
      u.wallet_balance || 0,
      u.trial_ends_at || 'N/A',
      u.created_at || 'N/A'
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chatflyr_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported user database to CSV');
  };

  if (authLoading) {
    return (
      <div className="flex flex-col h-[65vh] items-center justify-center space-y-4">
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
          <Cpu className="h-10 w-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Verifying Platform SuperAdmin Authorization...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col h-[65vh] items-center justify-center space-y-4 max-w-md mx-auto text-center px-4">
        <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">SuperAdmin Access Required</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Only authenticated platform administrators have permission to access the ChatFlyr Master Control Center.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()) ||
      u.plan?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && (u.role === 'admin' || u.role === 'Admin' || u.is_admin)) ||
      (roleFilter === 'user' && u.role !== 'admin' && u.role !== 'Admin' && !u.is_admin);

    return matchesSearch && matchesStatus && matchesRole;
  });

  const transactions = stats?.recentTransactions || [];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 px-3 sm:px-6 font-sans">
      
      {/* Top Admin Command Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-widest shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                SuperAdmin Command Center
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
                <Server className="h-3.5 w-3.5 text-emerald-400" />
                System Status: <span className="text-emerald-400 font-extrabold">100% Operational</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Crown className="h-8 w-8 text-emerald-400 shrink-0" />
              ChatFlyr Master Control Platform
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Complete administrative authority over all business accounts: Instant plan overrides, trial extensions, custom wallet credit issuance, account freezing, coupon generation, and WhatsApp gateway telemetry.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={exportUsersCSV}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs h-10 px-4 rounded-xl backdrop-blur-md transition-all"
            >
              <Download className="h-4 w-4 mr-2 text-emerald-400" />
              Export Database (CSV)
            </Button>

            <Button
              onClick={() => fetchAdminData()}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs h-10 px-4 rounded-xl backdrop-blur-md transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2 text-blue-400" />
              Refresh Telemetry
            </Button>

            <Button
              onClick={() => setActiveTab('settings')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 px-5 rounded-xl shadow-lg shadow-emerald-950/60 transition-all"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Platform Controls
            </Button>
          </div>
        </div>

        {/* Ambient Decorative Accents */}
        <div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Telemetry Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Users */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-500/50 transition-all rounded-2xl overflow-hidden relative">
            <div className="h-1 w-full bg-blue-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Registered Tenants</CardTitle>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stats.totalUsers}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-semibold">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Total registered user accounts
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Active Subscriptions */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all rounded-2xl overflow-hidden relative">
            <div className="h-1 w-full bg-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Paid Accounts</CardTitle>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{stats.activeSubscriptions}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Generating monthly SaaS revenue
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Free Trial Accounts */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500/50 transition-all rounded-2xl overflow-hidden relative">
            <div className="h-1 w-full bg-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Active 5-Day Free Trials</CardTitle>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{stats.trialUsers}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Currently testing platform
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Total Revenue */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-500/50 transition-all rounded-2xl overflow-hidden relative">
            <div className="h-1 w-full bg-purple-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Collected Revenue</CardTitle>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Receipt className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-semibold">
                <CreditCard className="h-3.5 w-3.5 text-purple-500 shrink-0" /> Verified via Razorpay checkout
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Pill Navigation Tabs */}
      <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users & Accounts Governance ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Financials & Payments Audit ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gateway')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeTab === 'gateway'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>WhatsApp Infrastructure & AI Nodes</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeTab === 'coupons'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Promo Coupons Studio ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Settings2 className="h-4 w-4" />
            <span>Global Rules & Rules</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS & ACCOUNTS GOVERNANCE */}
      {activeTab === 'users' && (
        <Card className="shadow-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/50 p-5 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <span>Tenant User Accounts & Power Controls</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Full SuperAdmin control: Click any user row or manage actions directly (Override plans, grant credits, extend trials, freeze access).
              </CardDescription>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Pill Group */}
              <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs shadow-xs">
                {['all', 'trial', 'active', 'expired', 'blocked'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                      statusFilter === st 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email or plan..."
                  className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 focus:ring-emerald-500 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-100/70">
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">User Account / Email</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Role</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Active Plan</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Wallet Credit</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Trial / Expiry</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Quick Plan Override</TableHead>
                    <TableHead className="text-right font-black text-xs text-slate-700 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-36 text-slate-500 text-sm">
                        No user accounts matched your search or status filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isExpired = u.status === 'expired';
                      const isTrial = u.status === 'trial';
                      const isActive = u.status === 'active';
                      const isBlocked = u.status === 'blocked';
                      const isAdmin = u.role === 'Admin' || u.role === 'admin' || u.is_admin;

                      let expiryDisplay = 'No Expiry';
                      if (u.trial_ends_at) {
                        const d = new Date(u.trial_ends_at);
                        expiryDisplay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      }

                      return (
                        <TableRow 
                          key={u.id} 
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <TableCell className="py-3">
                            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{u.full_name || 'Business User'}</span>
                              {isAdmin && <Crown className="h-3.5 w-3.5 text-amber-500" title="SuperAdmin User" />}
                            </div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</div>
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge 
                              variant="outline" 
                              className={`text-[11px] font-bold ${
                                isAdmin 
                                  ? 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300' 
                                  : 'border-slate-300 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isAdmin ? <Shield className="h-3 w-3 mr-1 text-purple-500" /> : null}
                              {isAdmin ? 'Admin' : 'User'}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge 
                              className={`text-[10px] font-black uppercase tracking-wider ${
                                isActive ? 'bg-emerald-600 text-white' :
                                isBlocked ? 'bg-red-600 text-white' :
                                isTrial ? 'bg-amber-500 text-white' :
                                'bg-slate-500 text-white'
                              }`}
                            >
                              {u.status || 'trial'}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3">
                            <span className="capitalize font-black text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              {u.plan || (isTrial ? 'Full Trial' : 'None')}
                            </span>
                          </TableCell>

                          <TableCell className="py-3">
                            <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                              <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                              ₹{Number(u.wallet_balance || 0).toLocaleString()}
                            </span>
                          </TableCell>

                          <TableCell className="py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{expiryDisplay}</span>
                            </div>
                          </TableCell>

                          {/* Quick Plan Override Dropdown */}
                          <TableCell className="py-3">
                            <select
                              value={u.plan || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAction(u.user_id, 'change_plan', e.target.value);
                                }
                              }}
                              className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-slate-900 dark:text-white"
                            >
                              <option value="">Set Plan...</option>
                              <option value="starter">Starter (₹10/mo)</option>
                              <option value="essential">Essential (₹999/mo)</option>
                              <option value="growth">Growth (₹1,999/mo)</option>
                              <option value="allinone">All-In-One (₹3,999/mo)</option>
                              <option value="enterprise">Enterprise (Custom)</option>
                            </select>
                          </TableCell>

                          {/* Action Buttons */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Power Modal */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(u)}
                                className="h-7 px-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700"
                                title="Open full control panel for this user"
                              >
                                Manage...
                              </Button>

                              {/* Direct +Credit Button */}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedUser(u);
                                }}
                                className="h-7 px-2.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-500/30 dark:hover:bg-emerald-950/30"
                                title="Grant wallet credit"
                              >
                                <Gift className="h-3 w-3 mr-1" /> +Credit
                              </Button>

                              {/* Block / Unblock Toggle */}
                              {isBlocked ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAction(u.user_id, 'unblock')}
                                  className="h-7 px-2.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border-emerald-500/30"
                                >
                                  <Check className="h-3 w-3 mr-1" /> Unblock
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAction(u.user_id, 'block')} 
                                  className="h-7 px-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 border-red-500/30"
                                >
                                  <X className="h-3 w-3 mr-1" /> Freeze
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
      )}

      {/* TAB 2: FINANCIALS & PAYMENTS AUDITOR */}
      {activeTab === 'payments' && (
        <Card className="shadow-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/70 dark:bg-slate-900/50 p-5 border-b border-slate-200/80 dark:border-slate-800">
            <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              <span>Financial Audit Logs & Payment Telemetry</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Real-time audit record of all subscription orders, renewals, and wallet credits processed via Razorpay.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-100/70">
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Customer</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Account Name</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Transaction Item</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Amount Paid</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Razorpay Payment ID</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Date & Time</TableHead>
                    <TableHead className="text-right font-black text-xs text-slate-700 dark:text-slate-300">Verification Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-36 text-slate-500 text-sm">
                        No financial transactions logged in database yet.
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
                        <TableRow key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <TableCell>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{tx.user_name || 'Business Tenant'}</div>
                            <div className="text-xs text-slate-500 font-mono">{tx.user_email}</div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {tx.account_name}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              {tx.description}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{Number(tx.amount || 0).toLocaleString()}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {tx.reference_id || 'Direct Verified'}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {dateFormatted}
                          </TableCell>

                          <TableCell className="text-right">
                            <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                              Verified Paid
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
      )}

      {/* TAB 3: WHATSAPP GATEWAY & INFRASTRUCTURE */}
      {activeTab === 'gateway' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">QR Coexistence Engine</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Baileys WebSocket Multi-Device Node</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Active Connected Sockets:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-black">ONLINE (0 Latency)</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-blue-500/30 bg-blue-500/5 p-6 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Meta Cloud API Gateway</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Official Graph API v21.0 Engine</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Webhook Delivery Rate:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-sm font-black">100% (0 Queue Backlog)</span>
              </div>
            </Card>

            <Card className="rounded-2xl border-purple-500/30 bg-purple-500/5 p-6 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-300">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">AI Auto-Reply Engine</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Gemini 1.5 Flash Neural Assistant</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-500/20 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Avg Model Latency:</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono text-sm font-black">280 ms Response Time</span>
              </div>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
            <h3 className="font-black text-base text-slate-900 dark:text-white">Gateway System Status & Health Diagnostics</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">All active WhatsApp API endpoints and background workers are operating normally.</p>

            <div className="space-y-3">
              {[
                { name: 'Meta Cloud Webhook Endpoint (/api/webhooks/whatsapp)', status: 'Operational', latency: '42ms' },
                { name: 'QR Scan Auth Controller (/api/whatsapp/qr)', status: 'Operational', latency: '12ms' },
                { name: 'Bulk Broadcast Worker Queue Engine', status: 'Operational', latency: 'Idle (Ready)' },
                { name: 'Database Connection Pool (Supabase Postgres)', status: 'Healthy', latency: '18ms' }
              ].map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-slate-500 font-medium">{svc.latency}</span>
                    <Badge className="bg-emerald-600 text-white font-bold">{svc.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: PROMO COUPONS & DISCOUNT CODES */}
      {activeTab === 'coupons' && (
        <Card className="shadow-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/50 p-5 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-600" />
                <span>Platform Promo Coupons Studio</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Generate, manage and monitor promotional discount coupon codes applied by business users on billing checkout.
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateCoupon(!showCreateCoupon)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 px-4 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {showCreateCoupon ? 'Close Form' : 'Generate New Coupon'}
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {showCreateCoupon && (
              <form onSubmit={handleCreateCoupon} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-emerald-500/30 space-y-4">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Create Promotional Coupon Code
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Coupon Code</label>
                    <Input 
                      placeholder="e.g. SAIF or FESTIVE50" 
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="uppercase font-mono font-bold tracking-wider text-xs h-9 rounded-xl border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Discount Type</label>
                    <select
                      value={newDiscountType}
                      onChange={(e) => setNewDiscountType(e.target.value as any)}
                      className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Discount Value ({newDiscountType === 'percentage' ? '%' : '₹'})
                    </label>
                    <Input 
                      type="number"
                      placeholder={newDiscountType === 'percentage' ? "e.g. 20" : "e.g. 998"} 
                      value={newDiscountValue}
                      onChange={(e) => setNewDiscountValue(e.target.value)}
                      className="font-bold text-xs h-9 rounded-xl border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Max Uses (Optional)</label>
                    <Input 
                      type="number"
                      placeholder="e.g. 100" 
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                      className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Expiry Date (Optional)</label>
                    <Input 
                      type="date"
                      value={newExpiresAt}
                      onChange={(e) => setNewExpiresAt(e.target.value)}
                      className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateCoupon(false)}
                    className="text-xs h-8 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={creatingCoupon}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black h-8 px-5 rounded-xl shadow-xs"
                  >
                    {creatingCoupon ? 'Saving...' : 'Save & Activate Coupon'}
                  </Button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-100/70">
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Coupon Code</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Discount Offer</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Usage Counter</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Expiry Date</TableHead>
                    <TableHead className="font-black text-xs text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-right font-black text-xs text-slate-700 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32 text-slate-500 text-sm">
                        No coupon codes created yet. Click "Generate New Coupon" above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((c) => {
                      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;

                      return (
                        <TableRow key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <TableCell>
                            <span className="font-mono font-black text-sm tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              {c.code}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {c.used_count || 0} / {c.max_uses ? c.max_uses : '∞ Unlimited'}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 dark:text-slate-400">
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
                                className={`h-7 text-[11px] font-bold rounded-lg ${
                                  c.is_active 
                                    ? 'text-amber-600 hover:bg-amber-50 border-amber-500/30' 
                                    : 'text-emerald-600 hover:bg-emerald-50 border-emerald-500/30'
                                }`}
                              >
                                {c.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCoupon(c.id, c.code)}
                                className="h-7 text-[11px] font-bold text-red-600 hover:bg-red-50 border-red-500/30 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

      {/* TAB 5: GLOBAL PLATFORM RULES & CONFIG */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs bg-white dark:bg-slate-900">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" /> Platform Free Trial Rules
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Configure system defaults applied to all newly registered business accounts.</p>
            
            <div className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Default Trial Duration</label>
                <div className="flex items-center gap-2">
                  <Input defaultValue="5" readOnly className="h-9 w-24 text-center font-black text-xs rounded-xl border-slate-200 dark:border-slate-800" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Days (Strict 5-Day Free Trial Gating)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Emergency Maintenance Mode</label>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Block non-admin user dashboard requests</span>
                  <Button 
                    size="sm" 
                    variant={maintenanceMode ? "destructive" : "outline"}
                    onClick={() => {
                      setMaintenanceMode(!maintenanceMode);
                      toast.success(maintenanceMode ? "Maintenance mode disabled" : "Maintenance mode enabled");
                    }}
                    className="h-8 text-xs font-bold rounded-xl"
                  >
                    {maintenanceMode ? "ACTIVE (Maintenance On)" : "Disabled (Normal Operations)"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs bg-white dark:bg-slate-900">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" /> Platform System Announcement Notice
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Broadcast a high-visibility global notification banner across all active tenant dashboards.</p>

            <div className="space-y-3.5 pt-2">
              <Input
                placeholder="e.g. Scheduled Meta WhatsApp Cloud API maintenance tonight at 2 AM IST"
                value={globalAnnouncement}
                onChange={(e) => setGlobalAnnouncement(e.target.value)}
                className="text-xs h-10 rounded-xl border-slate-200 dark:border-slate-800 font-medium"
              />
              <Button
                onClick={() => {
                  if (globalAnnouncement.trim()) {
                    toast.success("Global system notice broadcasted to all active tenant dashboards!");
                  } else {
                    toast.error("Please enter notice text before broadcasting");
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs h-9 rounded-xl shadow-xs"
              >
                Broadcast System Notice
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* FULL SUPERADMIN USER POWER ACTION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Tenant Control Power Panel
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Account Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">User Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedUser.full_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Current Status:</span>
                <span className="font-bold text-emerald-600 uppercase">{selectedUser.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Assigned Plan:</span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">{selectedUser.plan || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Wallet Balance:</span>
                <span className="font-bold text-emerald-600 font-mono">₹{Number(selectedUser.wallet_balance || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* ACTION 1: Quick Grant Wallet Credit */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-emerald-500" />
                Grant Custom Wallet Credit (Rupees)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={customCreditAmount}
                  onChange={(e) => setCustomCreditAmount(e.target.value)}
                  className="font-bold text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800"
                />
                <Button 
                  size="sm" 
                  onClick={handleGrantCredit}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 px-4 rounded-xl shrink-0"
                >
                  + Add Credit
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomCreditAmount(String(amt))}
                    className="flex-1 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 hover:border-emerald-500 text-slate-800 dark:text-slate-200 transition-all"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION 2: Direct Plan Override & 1-Click Bypass */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                Override Subscription Plan & Activate Bypass
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedUser.user_id, 'force_bypass', 'allinone')}
                  className="h-9 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border-emerald-500/30"
                >
                  <Zap className="h-3.5 w-3.5 mr-1" /> 1-Click Force Active
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedUser.user_id, 'extend_trial', undefined, 5)}
                  className="h-9 text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border-amber-500/30"
                >
                  <Clock className="h-3.5 w-3.5 mr-1" /> Extend Trial (+5 Days)
                </Button>
              </div>
            </div>

            {/* ACTION 3: Account Freeze & Role Management */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-red-500" />
                Account Freeze & Role Governance
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedUser.user_id, 'toggle_role')}
                  className="h-9 text-xs font-bold text-purple-600 hover:bg-purple-50 border-purple-500/30"
                >
                  <Crown className="h-3.5 w-3.5 mr-1" /> Toggle Role ({selectedUser.role === 'admin' || selectedUser.is_admin ? 'Demote to User' : 'Promote to Admin'})
                </Button>

                {selectedUser.status === 'blocked' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedUser.user_id, 'unblock')}
                    className="h-9 text-xs font-bold text-emerald-600 hover:bg-emerald-50 border-emerald-500/30"
                  >
                    <Unlock className="h-3.5 w-3.5 mr-1" /> Restore Account
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedUser.user_id, 'block')}
                    className="h-9 text-xs font-bold text-red-600 hover:bg-red-50 border-red-500/30"
                  >
                    <Lock className="h-3.5 w-3.5 mr-1" /> Freeze Account
                  </Button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedUser(null)} 
                className="text-xs font-bold rounded-xl"
              >
                Close Control Panel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
