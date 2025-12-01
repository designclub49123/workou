import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClipboardTick, ClipboardClose, Clock, Star1 } from 'iconsax-react';

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (*),
          profiles:applicant_id (*)
        `)
        .eq('applicant_id', user?.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Pending' },
      accepted: { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Accepted' },
      rejected: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Rejected' },
      withdrawn: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', label: 'Withdrawn' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <ClipboardTick size={20} variant="Bold" className="text-green-500" />;
      case 'rejected':
        return <ClipboardClose size={20} variant="Bold" className="text-red-500" />;
      default:
        return <Clock size={20} variant="Bold" className="text-yellow-500" />;
    }
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  const ApplicationCard = ({ application }: { application: any }) => (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {getStatusIcon(application.status)}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground text-lg">{application.jobs.title}</h3>
                <p className="text-sm text-muted-foreground">{application.jobs.location}</p>
              </div>
              {getStatusBadge(application.status)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Event Type:</span>
                <span className="ml-2 font-medium text-foreground">{application.jobs.event_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Wage:</span>
                <span className="ml-2 font-medium text-foreground">₹{application.jobs.wage_per_hour}/hour</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium text-foreground">{application.jobs.total_hours} hours</span>
              </div>
              <div>
                <span className="text-muted-foreground">Applied:</span>
                <span className="ml-2 font-medium text-foreground">
                  {new Date(application.applied_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {application.cover_letter && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Your message:</span> {application.cover_letter}
                </p>
              </div>
            )}

            {application.status === 'accepted' && (
              <div className="pt-2">
                <p className="text-sm text-green-600 font-medium">
                  🎉 Congratulations! You've been selected for this job.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout title="My Applications">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Applications">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({filterApplications('pending').length})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({filterApplications('accepted').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({filterApplications('rejected').length})</TabsTrigger>
            <TabsTrigger value="withdrawn">Withdrawn ({filterApplications('withdrawn').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No applications yet. Start applying to jobs!</p>
                </CardContent>
              </Card>
            ) : (
              applications.map(app => <ApplicationCard key={app.id} application={app} />)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterApplications('pending').map(app => <ApplicationCard key={app.id} application={app} />)}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {filterApplications('accepted').map(app => <ApplicationCard key={app.id} application={app} />)}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {filterApplications('rejected').map(app => <ApplicationCard key={app.id} application={app} />)}
          </TabsContent>

          <TabsContent value="withdrawn" className="space-y-4">
            {filterApplications('withdrawn').map(app => <ApplicationCard key={app.id} application={app} />)}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Applications;
