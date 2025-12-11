import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BrifecaseTimer, Calendar, Wallet, Star1, TrendUp, People } from 'iconsax-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch jobs statistics
  const { data: jobsStats } = useQuery({
    queryKey: ['jobs-stats', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return null;

      if (userRole === 'organizer' || userRole === 'admin') {
        // Get organizer's jobs
        const { data, error } = await supabase
          .from('jobs')
          .select('id, status')
          .eq('organizer_id', user.id);
        if (error) throw error;
        return {
          total: data.length,
          active: data.filter(j => j.status === 'open').length,
          completed: data.filter(j => j.status === 'completed').length,
        };
      } else {
        // Get user's applications
        const { data, error } = await supabase
          .from('job_applications')
          .select('id, status')
          .eq('applicant_id', user.id);
        if (error) throw error;
        return {
          total: data.length,
          active: data.filter(j => j.status === 'accepted').length,
          completed: data.filter(j => j.status === 'accepted').length, // This would need job status check
        };
      }
    },
    enabled: !!user?.id && !!userRole,
  });

  if (!user) {
    return (
      <Layout title="Dashboard">
        <div className="p-4">Loading...</div>
      </Layout>
    );
  }

  const isOrganizer = userRole === 'organizer' || userRole === 'admin';

  return (
    <Layout title="Dashboard">
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-brand-red/10 via-rose-500/10 to-brand-orange/10 rounded-lg p-6 border border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {profile?.full_name || 'User'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                {isOrganizer ? 'Manage your events and find talented workers' : 'Find exciting job opportunities today'}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {userRole?.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isOrganizer ? 'Total Jobs' : 'Applications'}
              </CardTitle>
              <BrifecaseTimer size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobsStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {isOrganizer ? 'Jobs posted' : 'Jobs applied'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Calendar size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobsStats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                {isOrganizer ? 'Open positions' : 'Ongoing jobs'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star1 size={20} className="text-muted-foreground" variant="Bold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.rating?.toFixed(1) || '0.0'}</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendUp size={20} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.total_jobs_completed || 0}</div>
              <p className="text-xs text-muted-foreground">Jobs completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              {isOrganizer ? 'Manage your workforce and events' : 'Start your job search'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isOrganizer ? (
              <>
                <Button onClick={() => navigate('/post-job')} className="w-full">
                  <BrifecaseTimer size={20} className="mr-2" />
                  Post New Job
                </Button>
                <Button onClick={() => navigate('/manage-applications')} variant="outline" className="w-full">
                  <People size={20} className="mr-2" />
                  View Applications
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/jobs')} className="w-full">
                  <BrifecaseTimer size={20} className="mr-2" />
                  Browse Jobs
                </Button>
                <Button onClick={() => navigate('/profile')} variant="outline" className="w-full">
                  <Star1 size={20} className="mr-2" />
                  Complete Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Profile Completion */}
        {!isOrganizer && profile?.verification_status === 'pending' && (
          <Card className="border-brand-orange/50 bg-brand-orange/5">
            <CardHeader>
              <CardTitle className="text-brand-orange">Complete Your Profile</CardTitle>
              <CardDescription>
                Increase your chances of getting hired by completing your profile and verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/profile')} variant="outline">
                Complete Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
