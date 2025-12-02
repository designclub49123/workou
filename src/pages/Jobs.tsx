import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Location, Clock, MoneyRecive, SearchNormal, Filter, Calendar, People } from 'iconsax-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { JobDetailsDialog } from '@/components/jobs/JobDetailsDialog';
import { ApplyJobDialog } from '@/components/jobs/ApplyJobDialog';
import { JobBookmarkButton } from '@/components/jobs/JobBookmarkButton';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Job {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string | null;
  location: string;
  wage_per_hour: number;
  start_date: string;
  end_date: string;
  workers_needed: number;
  workers_hired: number;
  event_type: string | null;
  requirements: string[] | null;
  dress_code: string | null;
  is_urgent: boolean;
  meal_provided: boolean;
  transportation_provided: boolean;
  status: string;
  total_hours: number | null;
  organizer_id: string;
  organizer?: {
    full_name: string | null;
    rating: number | null;
    total_jobs_completed: number | null;
  };
  skills?: Array<{
    skill: {
      name: string;
      category: string | null;
    };
    is_required: boolean;
  }>;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterUrgent, setFilterUrgent] = useState<string>('all');
  const [filterWage, setFilterWage] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
    fetchUserApplications();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, filterCity, filterUrgent, filterWage, jobs]);

  const fetchJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          job_skills(
            skills(name, category),
            is_required
          )
        `)
        .eq('status', 'open')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const organizerIds = jobsData?.map(job => job.organizer_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, rating, total_jobs_completed')
        .in('id', organizerIds);

      const jobsWithProfiles = jobsData?.map(job => {
        const organizer = profilesData?.find(p => p.id === job.organizer_id);
        return {
          ...job,
          organizer: organizer || undefined,
          skills: job.job_skills?.map((js: any) => ({
            skill: js.skills,
            is_required: js.is_required
          })) || []
        };
      });

      setJobs(jobsWithProfiles || []);
      setFilteredJobs(jobsWithProfiles || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', user.id);

      if (error) throw error;
      
      const appliedJobIds = new Set(data?.map(app => app.job_id) || []);
      setAppliedJobs(appliedJobIds);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCity !== 'all') {
      filtered = filtered.filter(job => job.city === filterCity);
    }

    if (filterUrgent === 'urgent') {
      filtered = filtered.filter(job => job.is_urgent);
    }

    if (filterWage !== 'all') {
      const minWage = parseInt(filterWage);
      filtered = filtered.filter(job => job.wage_per_hour >= minWage);
    }

    setFilteredJobs(filtered);
  };

  const getUniqueCities = () => {
    const cities = jobs.map(job => job.city);
    return Array.from(new Set(cities)).sort();
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailsDialogOpen(true);
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setApplyDialogOpen(true);
  };

  const handleApplyFromDetails = () => {
    setDetailsDialogOpen(false);
    setApplyDialogOpen(true);
  };

  const handleApplicationSuccess = () => {
    fetchUserApplications();
    fetchJobs();
  };

  const getWorkDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours < 24) {
      return `${Math.round(hours)} hours`;
    }
    return `${Math.round(hours / 24)} days`;
  };

  const estimateEarnings = (job: Job) => {
    const hours = job.total_hours || 8;
    return Math.round(job.wage_per_hour * hours);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Layout title="Browse Jobs">
        <div className="container mx-auto px-4 py-6">
          <LoadingSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Browse Jobs">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Available Opportunities</h2>
          <p className="text-sm text-muted-foreground">Find your next part-time gig ({filteredJobs.length} jobs)</p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <SearchNormal size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs, locations, event types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Location size={16} className="mr-2 flex-shrink-0" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {getUniqueCities().map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterUrgent} onValueChange={setFilterUrgent}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter size={16} className="mr-2 flex-shrink-0" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="urgent">Urgent Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterWage} onValueChange={setFilterWage}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <MoneyRecive size={16} className="mr-2 flex-shrink-0" />
                <SelectValue placeholder="Min Wage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Wage</SelectItem>
                <SelectItem value="100">₹100+/hr</SelectItem>
                <SelectItem value="200">₹200+/hr</SelectItem>
                <SelectItem value="300">₹300+/hr</SelectItem>
                <SelectItem value="500">₹500+/hr</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <SearchNormal size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No jobs found matching your criteria</p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setFilterCity('all');
                  setFilterUrgent('all');
                  setFilterWage('all');
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="border-border hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground">
                            {job.title}
                          </h3>
                          {job.is_urgent && (
                            <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>
                          )}
                          {appliedJobs.has(job.id) && (
                            <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                              Applied
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <JobBookmarkButton jobId={job.id} />
                        {job.event_type && (
                          <Badge variant="outline" className="hidden sm:inline-flex">{job.event_type}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Job Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Location size={16} variant="Bold" className="text-primary flex-shrink-0" />
                        <span className="text-muted-foreground truncate">{job.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock size={16} variant="Bold" className="text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{getWorkDuration(job.start_date, job.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar size={16} variant="Bold" className="text-primary flex-shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {format(new Date(job.start_date), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <People size={16} variant="Bold" className="text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {job.workers_hired}/{job.workers_needed} hired
                        </span>
                      </div>
                    </div>

                    {/* Wage and Earnings */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <MoneyRecive size={18} variant="Bold" className="text-green-500" />
                        <span className="font-semibold text-foreground">₹{job.wage_per_hour}/hour</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Est. earnings: <span className="font-medium text-green-600">₹{estimateEarnings(job)}</span>
                      </div>
                      {job.meal_provided && (
                        <Badge variant="secondary" className="text-xs">🍽️ Meals</Badge>
                      )}
                      {job.transportation_provided && (
                        <Badge variant="secondary" className="text-xs">🚗 Transport</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button 
                        onClick={() => handleApplyClick(job)}
                        disabled={appliedJobs.has(job.id) || job.workers_hired >= job.workers_needed}
                        className="flex-1 sm:flex-none"
                      >
                        {appliedJobs.has(job.id) ? 'Applied' : job.workers_hired >= job.workers_needed ? 'Position Filled' : 'Apply Now'}
                      </Button>
                      <Button variant="outline" onClick={() => handleViewDetails(job)} className="flex-1 sm:flex-none">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

export default Jobs;
