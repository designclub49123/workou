import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClipboardTick, ClipboardClose, Clock, Calendar, Location, MoneyRecive, Trash, MessageQuestion } from 'iconsax-react';
import { Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Application {
  id: string;
  job_id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  expected_wage: number | null;
  availability: string | null;
  years_experience: number | null;
  notes: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    city: string;
    location: string;
    wage_per_hour: number;
    start_date: string;
    end_date: string;
    event_type: string | null;
    total_hours: number | null;
    is_urgent: boolean;
  } | null;
}

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApplications();
      subscribeToUpdates();
    }
  }, [user]);

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('application-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications',
          filter: `applicant_id=eq.${user?.id}`,
        },
        (payload) => {
          setApplications((prev) =>
            prev.map((app) =>
              app.id === payload.new.id ? { ...app, status: payload.new.status } : app
            )
          );
          toast.success('Application status updated!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch applications
      const { data: applicationsData, error: appError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('applicant_id', user?.id)
        .order('applied_at', { ascending: false });

      if (appError) throw appError;

      if (!applicationsData || applicationsData.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Fetch jobs for these applications
      const jobIds = applicationsData.map((app) => app.job_id);
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds);

      if (jobsError) throw jobsError;

      // Merge data
      const mergedApplications = applicationsData.map((app) => ({
        ...app,
        job: jobsData?.find((job) => job.id === app.job_id) || null,
      }));

      setApplications(mergedApplications);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedApplication) return;

    try {
      setWithdrawing(true);
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApplication.id ? { ...app, status: 'withdrawn' } : app
        )
      );

      toast.success('Application withdrawn successfully');
    } catch (error: any) {
      console.error('Error withdrawing application:', error);
      toast.error('Failed to withdraw application');
    } finally {
      setWithdrawing(false);
      setWithdrawDialogOpen(false);
      setSelectedApplication(null);
    }
  };

  const openWithdrawDialog = (application: Application) => {
    setSelectedApplication(application);
    setWithdrawDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Pending' },
      accepted: { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Accepted' },
      rejected: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Rejected' },
      withdrawn: { color: 'bg-muted text-muted-foreground border-border', label: 'Withdrawn' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <ClipboardTick size={24} variant="Bold" className="text-green-500" />;
      case 'rejected':
        return <ClipboardClose size={24} variant="Bold" className="text-red-500" />;
      case 'withdrawn':
        return <Trash size={24} variant="Bold" className="text-muted-foreground" />;
      default:
        return <Clock size={24} variant="Bold" className="text-yellow-500" />;
    }
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter((app) => app.status === status);
  };

  const ApplicationCard = ({ application }: { application: Application }) => {
    if (!application.job) {
      return (
        <Card className="border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <MessageQuestion size={20} />
              <span>Job no longer available</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-border hover:shadow-md transition-all duration-200 group">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Icon - Hidden on mobile, shown on larger screens */}
            <div className="hidden sm:flex flex-shrink-0 w-12 h-12 items-center justify-center rounded-xl bg-muted/50">
              {getStatusIcon(application.status)}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Mobile status icon */}
                    <div className="sm:hidden">{getStatusIcon(application.status)}</div>
                    <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">
                      {application.job.title}
                    </h3>
                    {application.job.is_urgent && (
                      <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>
                    )}
                  </div>
                  {application.job.event_type && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {application.job.event_type}
                    </Badge>
                  )}
                </div>
                {getStatusBadge(application.status)}
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Location size={16} variant="Bold" className="text-primary flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{application.job.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MoneyRecive size={16} variant="Bold" className="text-green-500 flex-shrink-0" />
                  <span className="font-medium text-foreground">₹{application.job.wage_per_hour}/hr</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} variant="Bold" className="text-primary flex-shrink-0" />
                  <span className="text-muted-foreground truncate">
                    {format(new Date(application.job.start_date), 'MMM d')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={16} variant="Bold" className="text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {application.job.total_hours || 'TBD'} hrs
                  </span>
                </div>
              </div>

              {/* Applied Date & Cover Letter */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Applied {format(new Date(application.applied_at), 'PPP')}</span>
                  {application.expected_wage && (
                    <span>Expected: ₹{application.expected_wage}/hr</span>
                  )}
                </div>

                {application.cover_letter && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    "{application.cover_letter}"
                  </p>
                )}
              </div>

              {/* Status Messages */}
              {application.status === 'accepted' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm text-green-600 font-medium">
                    🎉 Congratulations! You've been selected for this job.
                  </p>
                </div>
              )}

              {application.status === 'rejected' && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    Don't give up! Keep applying to other opportunities.
                  </p>
                </div>
              )}

              {/* Actions */}
              {application.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWithdrawDialog(application)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash size={16} className="mr-1" />
                    Withdraw
                  </Button>
                </div>
              )}
            </div>

            {/* Chevron for mobile */}
            <div className="hidden sm:flex items-center">
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <Skeleton className="hidden sm:block h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="border-dashed">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <ClipboardTick size={32} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{message}</p>
          <Button variant="outline" onClick={() => window.location.href = '/jobs'}>
            Browse Jobs
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TabContent = ({ status }: { status: string }) => {
    const filtered = filterApplications(status);
    
    if (filtered.length === 0) {
      const messages: Record<string, string> = {
        all: "You haven't applied to any jobs yet.",
        pending: 'No pending applications.',
        accepted: 'No accepted applications yet.',
        rejected: 'No rejected applications.',
        withdrawn: 'No withdrawn applications.',
      };
      return <EmptyState message={messages[status]} />;
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        {filtered.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="My Applications">
        <div className="container mx-auto px-4 py-6">
          <LoadingSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Applications">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Applications</h2>
          <p className="text-sm text-muted-foreground">Track and manage your job applications</p>
        </div>

        {/* Stats Summary - Mobile friendly */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{applications.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-500">
              {filterApplications('pending').length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-500">
              {filterApplications('accepted').length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Accepted</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="text-2xl sm:text-3xl font-bold text-red-500">
              {filterApplications('rejected').length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Rejected</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">
              All ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 text-xs sm:text-sm">
              Pending ({filterApplications('pending').length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1 text-xs sm:text-sm">
              Accepted ({filterApplications('accepted').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 text-xs sm:text-sm">
              Rejected ({filterApplications('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TabContent status="all" />
          </TabsContent>
          <TabsContent value="pending">
            <TabContent status="pending" />
          </TabsContent>
          <TabsContent value="accepted">
            <TabContent status="accepted" />
          </TabsContent>
          <TabsContent value="rejected">
            <TabContent status="rejected" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw your application for{' '}
              <strong>{selectedApplication?.job?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Applications;
