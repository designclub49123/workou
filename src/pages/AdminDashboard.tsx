import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { People, BrifecaseTimer, Wallet, ShieldTick, TrendUp, DocumentText } from 'iconsax-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch platform statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, jobsRes, applicationsRes, paymentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id', { count: 'exact' }),
        supabase.from('job_applications').select('id', { count: 'exact' }),
        supabase.from('payments').select('amount, status'),
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalJobs: jobsRes.count || 0,
        totalApplications: applicationsRes.count || 0,
        totalRevenue,
      };
    },
  });

  // Fetch pending verifications
  const { data: pendingVerifications, refetch: refetchVerifications } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all users
  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const handleVerifyUser = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: status })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
      refetchVerifications();
    } catch (error: any) {
      toast.error('Failed to update verification status');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'user' | 'organizer' | 'admin') => {
    try {
      // First, remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast.success('Role updated successfully');
    } catch (error: any) {
      toast.error('Failed to update role');
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="p-4 md:p-6 space-y-6">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-lg p-6 border border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Admin Control Center 🛡️
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage users, verifications, and platform operations
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1 bg-purple-500/10">
              ADMIN
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <People size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <BrifecaseTimer size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
              <p className="text-xs text-muted-foreground">Jobs posted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <DocumentText size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">Total applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <Wallet size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toFixed(0) || 0}</div>
              <p className="text-xs text-muted-foreground">Platform earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="verifications" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verifications">
              <ShieldTick size={16} className="mr-2" />
              Verifications
            </TabsTrigger>
            <TabsTrigger value="users">
              <People size={16} className="mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendUp size={16} className="mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
                <CardDescription>
                  Review and approve user verification requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingVerifications && pendingVerifications.length > 0 ? (
                  <div className="space-y-4">
                    {pendingVerifications.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{profile.full_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{profile.phone || 'No phone'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {profile.city || 'No city'} • Joined {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyUser(profile.id, 'verified')}
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVerifyUser(profile.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No pending verifications
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {allUsers && allUsers.length > 0 ? (
                  <div className="space-y-3">
                    {allUsers.slice(0, 10).map((profile: any) => (
                      <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{profile.full_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: <Badge variant="outline">{profile.verification_status}</Badge>
                          </p>
                        </div>
                        <Badge>{profile.user_roles?.[0]?.role || 'user'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Coming soon - Advanced analytics and insights</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <TrendUp size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Analytics dashboard will be available soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
