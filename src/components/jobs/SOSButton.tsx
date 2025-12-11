import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Warning2, Call, Location, Shield } from 'iconsax-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SOSButtonProps {
  jobId: string;
  className?: string;
}

const SOSButton = ({ jobId, className }: SOSButtonProps) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSOS = async () => {
    setSending(true);
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      // Create safety checkin with SOS type
      const { error } = await supabase
        .from('safety_checkins')
        .insert({
          user_id: user?.id,
          job_id: jobId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          checkin_type: 'sos',
          notes: 'Emergency SOS triggered'
        });

      if (error) throw error;

      // Get emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_primary', true)
        .single();

      toast.success('SOS Alert Sent!', {
        description: contacts 
          ? `Your emergency contact (${contacts.name}) will be notified`
          : 'Your location has been recorded'
      });

      setDialogOpen(false);
    } catch (error: any) {
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location to use SOS.');
      } else {
        toast.error('Failed to send SOS. Please try again or call emergency services.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className={`bg-red-500 hover:bg-red-600 ${className}`}
        onClick={() => setDialogOpen(true)}
      >
        <Warning2 size={16} className="mr-1" />
        SOS
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-4 p-4 rounded-full bg-red-500/10">
              <Warning2 size={40} className="text-red-500" />
            </div>
            <DialogTitle className="text-center">Emergency SOS</DialogTitle>
            <DialogDescription className="text-center">
              This will share your current location with your emergency contacts and our safety team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Location size={20} className="text-rose-500" />
              <span className="text-sm text-foreground">Your location will be shared</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Call size={20} className="text-rose-500" />
              <span className="text-sm text-foreground">Emergency contacts will be notified</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Shield size={20} className="text-rose-500" />
              <span className="text-sm text-foreground">Safety team will be alerted</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={handleSOS}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send SOS'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            For life-threatening emergencies, please also call 112
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SOSButton;