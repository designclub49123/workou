import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TickCircle, CloseCircle, Clock, User, Star1, Calendar, Location, MoneyRecive } from 'iconsax-react';
import { Loader2, Mail, Phone, ChevronDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  expected_wage: number | null;
  availability: string | null;
  years_experience: number | null;
  applicant: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    rating: number | null;
    total_jobs_completed: number | null;
    city: string | null;
    verification_status: string | null;
  } | null;
}

interface Job {
  id: string;
  title: string;
  city: string;
  wage_per_hour: number;
  start_date: string;
  workers_needed: number;
  workers_hired: number;
  status: string;
  applications: Application[];
}

const ManageApplications = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchJobsWithApplications();
    }
  }, [user]);

  const fetchJobsWithApplications = async () => {
    try {
      setLoading(true);

      // Fetch organizer's jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('organizer_id', user?.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      // Fetch applications for these jobs
      const jobIds = jobsData.map((j) => j.id);
      const { data: applicationsData, error: appError } = await supabase
        .from('job_applications')
        .select('*')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      if (appError) throw appError;

      // Fetch applicant profiles
      const applicantIds = [...new Set(applicationsData?.map((a) => a.applicant_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', applicantIds);

      // Merge data
      const jobsWithApplications = jobsData.map((job) => ({
        ...job,
        applications: (applicationsData || [])
          .filter((app) => app.job_id === job.id)
          .map((app) => ({
            ...app,
            applicant: profilesData?.find((p) => p.id === app.applicant_id) || null,
          })),
      }));

      setJobs(jobsWithApplications);
      
      // Expand jobs with pending applications by default
      const jobsWithPending = new Set(
        jobsWithApplications
          .filter((j) => j.applications.some((a) => a.status === 'pending'))
          .map((j) => j.id)
      );
      setExpandedJobs(jobsWithPending);
    } catch (error: any) {
      console.error('Error fetching jobs and applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, jobId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      setProcessingId(applicationId);

      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', applicationId);

      if (error) throw error;

      // If accepted, increment workers_hired
      if (newStatus === 'accepted') {
        const job = jobs.find((j) => j.id === jobId);
        if (job) {
          await supabase
            .from('jobs')
            .update({ workers_hired: (job.workers_hired || 0) + 1 })
            .eq('id', jobId);
        }
      }

      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                workers_hired: newStatus === 'accepted' ? (job.workers_hired || 0) + 1 : job.workers_hired,
                applications: job.applications.map((app) =>
                  app.id === applicationId ? { ...app, status: newStatus } : app
                ),
              }
            : job
        )
      );

      toast.success(`Application ${newStatus}!`);
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleJobExpanded = (jobId: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', label: 'Pending' },
      accepted: { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Accepted' },
      rejected: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Rejected' },
      withdrawn: { color: 'bg-muted text-muted-foreground', label: 'Withdrawn' },
    };
    const c = config[status] || config.pending;
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const ApplicationCard = ({ application, jobId, jobWage }: { application: Application; jobId: string; jobWage: number }) => {
    const applicant = application.applicant;

    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Applicant Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={applicant?.avatar_url || ''} />
                <AvatarFallback>
                  {applicant?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground">
                    {applicant?.full_name || 'Unknown User'}
                  </h4>
                  {applicant?.verification_status === 'verified' && (
                    <Badge className="bg-blue-500/10 text-blue-600 text-xs">✓ Verified</Badge>
                  )}
                  {getStatusBadge(application.status)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {applicant?.city && (
                    <span className="flex items-center gap-1">
                      <Location size={14} />
                      {applicant.city}
                    </span>
                  )}
                  {applicant?.rating && applicant.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star1 size={14} variant="Bold" className="text-yellow-500" />
                      {applicant.rating.toFixed(1)}
                    </span>
                  )}
                  {applicant?.total_jobs_completed && applicant.total_jobs_completed > 0 && (
                    <span>{applicant.total_jobs_completed} jobs done</span>
                  )}
                </div>

                {/* Application Details */}
                <div className="pt-2 space-y-1 text-sm">
                  {application.expected_wage && (
                    <p className="text-muted-foreground">
                      Expected: <span className={`font-medium ${application.expected_wage > jobWage ? 'text-red-500' : 'text-green-600'}`}>₹{application.expected_wage}/hr</span>
                      {application.expected_wage > jobWage && ' (above budget)'}
                    </p>
                  )}
                  {application.years_experience !== null && (
                    <p className="text-muted-foreground">
                      Experience: <span className="font-medium text-foreground">{application.years_experience} years</span>
                    </p>
                  )}
                  {application.availability && (
                    <p className="text-muted-foreground">
                      Availability: <span className="font-medium text-foreground">{application.availability}</span>
                    </p>
                  )}
                </div>

                {application.cover_letter && (
                  <div className="pt-2 border-t border-border mt-2">
                    <p className="text-sm text-muted-foreground italic">
                      "{application.cover_letter}"
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground pt-1">
                  Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Actions */}
            {application.status === 'pending' && (
              <div className="flex sm:flex-col gap-2 sm:w-32">
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(application.id, jobId, 'accepted')}
                  disabled={processingId === application.id}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processingId === application.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <TickCircle size={16} className="mr-1" />
                      Accept
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(application.id, jobId, 'rejected')}
                  disabled={processingId === application.id}
                  className="flex-1 text-red-500 hover:text-red-600"
                >
                  <CloseCircle size={16} className="mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout title="Manage Applications">
        <div className="container mx-auto px-4 py-6 space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  const totalPending = jobs.reduce((sum, job) => sum + job.applications.filter((a) => a.status === 'pending').length, 0);

  return (
    <Layout title="Manage Applications">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Manage Applications</h2>
            {totalPending > 0 && (
              <Badge className="bg-yellow-500/10 text-yellow-600">{totalPending} pending</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Review and manage applications for your jobs</p>
        </div>

        {/* Jobs with Applications */}
        {jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No jobs posted yet</p>
                <Button variant="outline" onClick={() => (window.location.href = '/post-job')}>
                  Post Your First Job
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const pendingCount = job.applications.filter((a) => a.status === 'pending').length;
              const acceptedCount = job.applications.filter((a) => a.status === 'accepted').length;
              const isExpanded = expandedJobs.has(job.id);

              return (
                <Collapsible key={job.id} open={isExpanded} onOpenChange={() => toggleJobExpanded(job.id)}>
                  <Card className="border-border">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base sm:text-lg">{job.title}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {job.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Location size={14} />
                                {job.city}
                              </span>
                              <span>•</span>
                              <span>₹{job.wage_per_hour}/hr</span>
                              <span>•</span>
                              <span>{acceptedCount}/{job.workers_needed} hired</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <div className="text-sm font-medium">{job.applications.length} applications</div>
                              {pendingCount > 0 && (
                                <div className="text-xs text-yellow-600">{pendingCount} pending</div>
                              )}
                            </div>
                            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {job.applications.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No applications yet for this job
                          </div>
                        ) : (
                          <Tabs defaultValue="pending" className="space-y-4">
                            <TabsList className="w-full sm:w-auto">
                              <TabsTrigger value="pending" className="flex-1 sm:flex-none">
                                Pending ({pendingCount})
                              </TabsTrigger>
                              <TabsTrigger value="accepted" className="flex-1 sm:flex-none">
                                Accepted ({acceptedCount})
                              </TabsTrigger>
                              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                                All ({job.applications.length})
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="pending" className="space-y-3">
                              {job.applications.filter((a) => a.status === 'pending').length === 0 ? (
                                <p className="text-center py-4 text-muted-foreground">No pending applications</p>
                              ) : (
                                job.applications
                                  .filter((a) => a.status === 'pending')
                                  .map((app) => (
                                    <ApplicationCard key={app.id} application={app} jobId={job.id} jobWage={job.wage_per_hour} />
                                  ))
                              )}
                            </TabsContent>

                            <TabsContent value="accepted" className="space-y-3">
                              {job.applications.filter((a) => a.status === 'accepted').length === 0 ? (
                                <p className="text-center py-4 text-muted-foreground">No accepted applications</p>
                              ) : (
                                job.applications
                                  .filter((a) => a.status === 'accepted')
                                  .map((app) => (
                                    <ApplicationCard key={app.id} application={app} jobId={job.id} jobWage={job.wage_per_hour} />
                                  ))
                              )}
                            </TabsContent>

                            <TabsContent value="all" className="space-y-3">
                              {job.applications.map((app) => (
                                <ApplicationCard key={app.id} application={app} jobId={job.id} jobWage={job.wage_per_hour} />
                              ))}
                            </TabsContent>
                          </Tabs>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageApplications;
