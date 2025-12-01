import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  wage_per_hour: number;
}

interface ApplyJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ApplyJobDialog = ({ job, open, onOpenChange, onSuccess }: ApplyJobDialogProps) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [availability, setAvailability] = useState('');
  const [expectedWage, setExpectedWage] = useState('');
  const [experience, setExperience] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;
    
    if (!coverLetter.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please write a cover letter',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create application with additional details in cover_letter
      const applicationDetails = {
        coverLetter: coverLetter.trim(),
        availability: availability.trim(),
        expectedWage: expectedWage.trim(),
        experience: experience.trim(),
      };

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          cover_letter: JSON.stringify(applicationDetails), // Store all details as JSON
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Application Submitted!',
        description: 'Your application has been sent to the organizer.',
      });

      // Reset form
      setCoverLetter('');
      setAvailability('');
      setExpectedWage('');
      setExperience('');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Fill in the details below to submit your application. The organizer will review and contact you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="coverLetter">
              Why are you a good fit? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell the organizer why you're perfect for this job..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Highlight your relevant skills and experience
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Your Availability</Label>
            <Input
              id="availability"
              placeholder="e.g., Available all days, Flexible hours"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedWage">Expected Wage (if different)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="expectedWage"
                type="number"
                placeholder={job.wage_per_hour.toString()}
                value={expectedWage}
                onChange={(e) => setExpectedWage(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">/hour</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Offered: ₹{job.wage_per_hour}/hour
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Relevant Experience</Label>
            <Textarea
              id="experience"
              placeholder="Describe your relevant experience for this role..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !coverLetter.trim()}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
