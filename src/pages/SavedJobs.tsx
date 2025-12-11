import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Location, Clock, MoneyRecive, Trash } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { JobDetailsDialog } from '@/components/jobs/JobDetailsDialog';
import { ApplyJobDialog } from '@/components/jobs/ApplyJobDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedJob {
  id: string;
  job_id: string;
  created_at: string;
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
    workers_needed: number;
    workers_hired: number;
    is_urgent: boolean;
    status: string;
  } | null;
}

const SavedJobs = () => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
      fetchAppliedJobs();
    }
  }, [user]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('job_bookmarks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookmarksError) throw bookmarksError;

      if (!bookmarks || bookmarks.length === 0) {
        setSavedJobs([]);
        setLoading(false);
        return;
      }

      const jobIds = bookmarks.map((b) => b.job_id);
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds);

      if (jobsError) throw jobsError;

      const merged = bookmarks.map((bookmark) => ({
        ...bookmark,
        job: jobs?.find((j) => j.id === bookmark.job_id) || null,
      }));

      setSavedJobs(merged);
    } catch (error: any) {
      console.error('Error fetching saved jobs:', error);
      toast.error('Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', user?.id);

      if (error) throw error;
      setAppliedJobs(new Set(data?.map((a) => a.job_id) || []));
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('job_bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      setSavedJobs((prev) => prev.filter((j) => j.id !== bookmarkId));
      toast.success('Job removed from saved');
    } catch (error: any) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove job');
    }
  };

  const handleViewDetails = (job: any) => {
    setSelectedJob(job);
    setDetailsDialogOpen(true);
  };

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setApplyDialogOpen(true);
  };

  const handleApplyFromDetails = () => {
    setDetailsDialogOpen(false);
    setApplyDialogOpen(true);
  };

  const handleApplicationSuccess = () => {
    fetchAppliedJobs();
  };

  const getWorkDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours < 24) return `${Math.round(hours)} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  if (loading) {
    return (
      <Layout title="Saved Jobs">
        <div className="container mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Saved Jobs">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Saved Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Jobs you've bookmarked for later ({savedJobs.length})
          </p>
        </div>

        {savedJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Heart size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No saved jobs yet</p>
                <p className="text-sm text-muted-foreground">
                  Bookmark jobs to easily find them later
                </p>
                <Button variant="outline" onClick={() => (window.location.href = '/jobs')}>
                  Browse Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {savedJobs.map((saved) => {
              if (!saved.job) {
                return (
                  <Card key={saved.id} className="border-border opacity-60">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Job no longer available</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBookmark(saved.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              const isAvailable = saved.job.status === 'open' && saved.job.workers_hired < saved.job.workers_needed;
              const hasApplied = appliedJobs.has(saved.job.id);

              return (
                <Card
                  key={saved.id}
                  className={`border-border hover:shadow-md transition-shadow ${!isAvailable ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                              {saved.job.title}
                            </h3>
                            {saved.job.is_urgent && (
                              <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>
                            )}
                            {hasApplied && (
                              <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                                Applied
                              </Badge>
                            )}
                            {!isAvailable && (
                              <Badge variant="outline" className="text-xs">Closed</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {saved.job.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveBookmark(saved.id)}
                          className="flex-shrink-0"
                        >
                          <Heart size={20} variant="Bold" className="text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Location size={16} variant="Bold" className="text-primary flex-shrink-0" />
                          <span className="text-muted-foreground truncate">{saved.job.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} variant="Bold" className="text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {getWorkDuration(saved.job.start_date, saved.job.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm col-span-2 sm:col-span-1">
                          <MoneyRecive size={16} variant="Bold" className="text-green-500 flex-shrink-0" />
                          <span className="font-semibold text-foreground">
                            ₹{saved.job.wage_per_hour}/hour
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                        {isAvailable && !hasApplied && (
                          <Button 
                            onClick={() => handleApplyClick(saved.job)} 
                            className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all duration-300 shadow-md border-0"
                          >
                            Apply Now
                          </Button>
                        )}
                        {hasApplied && (
                          <Button 
                            disabled
                            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white cursor-default font-semibold border-0"
                          >
                            ✓ Applied
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => handleViewDetails(saved.job)}
                          className="flex-1 sm:flex-none"
                        >
                          View Details
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Saved {format(new Date(saved.created_at), 'PPP')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <JobDetailsDialog
        job={selectedJob}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onApply={handleApplyFromDetails}
        hasApplied={selectedJob ? appliedJobs.has(selectedJob.id) : false}
      />

      <ApplyJobDialog
        job={selectedJob}
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        onSuccess={handleApplicationSuccess}
      />
    </Layout>
  );
};

export default SavedJobs;
