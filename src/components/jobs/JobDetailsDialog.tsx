import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Location, Clock, MoneyRecive, Calendar, Profile2User, ClipboardText, Briefcase } from 'iconsax-react';
import { format } from 'date-fns';
import StartChatButton from '@/components/chat/StartChatButton';

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
  organizer_id?: string;
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

interface JobDetailsDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  hasApplied?: boolean;
}

export const JobDetailsDialog = ({ job, open, onOpenChange, onApply, hasApplied }: JobDetailsDialogProps) => {
  if (!job) return null;

  const calculateTotalWage = () => {
    const startDate = new Date(job.start_date);
    const endDate = new Date(job.end_date);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours * job.wage_per_hour;
  };

  const getWorkDuration = () => {
    const startDate = new Date(job.start_date);
    const endDate = new Date(job.end_date);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (hours < 24) {
      return `${Math.round(hours)} hours`;
    }
    return `${Math.round(hours / 24)} days`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl">{job.title}</DialogTitle>
                {job.is_urgent && (
                  <Badge className="bg-red-500 text-white">Urgent</Badge>
                )}
              </div>
              {job.event_type && (
                <Badge variant="outline">{job.event_type}</Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-base mt-2">
            {job.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Location size={20} variant="Bold" className="text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{job.location}</p>
                <p className="text-sm text-muted-foreground">{job.city}{job.state ? `, ${job.state}` : ''}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MoneyRecive size={20} variant="Bold" className="text-green-500 mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Payment</p>
                <p className="font-medium">₹{job.wage_per_hour}/hour</p>
                <p className="text-sm text-muted-foreground">Total: ₹{calculateTotalWage()}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={20} variant="Bold" className="text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(new Date(job.start_date), 'PPp')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={20} variant="Bold" className="text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{getWorkDuration()}</p>
                <p className="text-sm text-muted-foreground">Until {format(new Date(job.end_date), 'PPp')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Profile2User size={20} variant="Bold" className="text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Workers Needed</p>
                <p className="font-medium">{job.workers_needed - job.workers_hired} available</p>
                <p className="text-sm text-muted-foreground">{job.workers_hired} already hired</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Required Skills */}
          {job.skills && job.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={20} variant="Bold" className="text-primary" />
                <h3 className="font-semibold">Required Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <Badge key={index} variant={skill.is_required ? "default" : "outline"}>
                    {skill.skill.name}
                    {skill.is_required && <span className="ml-1">*</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardText size={20} variant="Bold" className="text-primary" />
                <h3 className="font-semibold">Requirements</h3>
              </div>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Benefits */}
          <div>
            <h3 className="font-semibold mb-3">Additional Benefits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${job.meal_provided ? 'bg-green-500' : 'bg-muted'}`} />
                <span className={job.meal_provided ? 'text-foreground' : 'text-muted-foreground'}>
                  Meal Provided
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${job.transportation_provided ? 'bg-green-500' : 'bg-muted'}`} />
                <span className={job.transportation_provided ? 'text-foreground' : 'text-muted-foreground'}>
                  Transportation Provided
                </span>
              </div>
            </div>
          </div>

          {job.dress_code && (
            <div>
              <h3 className="font-semibold mb-2">Dress Code</h3>
              <p className="text-muted-foreground">{job.dress_code}</p>
            </div>
          )}

          {/* Organizer Info */}
          {job.organizer && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Organizer Information</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Profile2User size={24} variant="Bold" className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{job.organizer.full_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {job.organizer.rating !== null && (
                          <span>⭐ {job.organizer.rating.toFixed(1)}</span>
                        )}
                        {job.organizer.total_jobs_completed !== null && (
                          <span>• {job.organizer.total_jobs_completed} jobs completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {job.organizer_id && (
                    <StartChatButton
                      receiverId={job.organizer_id}
                      receiverName={job.organizer.full_name || 'Organizer'}
                      jobId={job.id}
                      variant="outline"
                      size="sm"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            onClick={onApply}
            disabled={hasApplied || job.workers_hired >= job.workers_needed}
            className={`flex-1 font-semibold transition-all duration-300 ${
              hasApplied 
                ? 'bg-green-500 hover:bg-green-600 text-white cursor-default border-0' 
                : job.workers_hired >= job.workers_needed
                ? 'bg-slate-400 text-white cursor-default border-0 hover:bg-slate-500'
                : 'bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md'
            }`}
          >
            {hasApplied ? '✓ Application Submitted' : job.workers_hired >= job.workers_needed ? '✗ Position Filled' : 'Apply Now'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

