import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Scan, TickCircle, Clock, Location, 
  Warning2, Timer1 
} from 'iconsax-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface QRCheckinProps {
  jobId: string;
  jobStartTime: string;
}

const QRCheckin = ({ jobId, jobStartTime }: QRCheckinProps) => {
  const { user } = useAuth();
  const [checkinData, setCheckinData] = useState<any>(null);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingLocation, setVerifyingLocation] = useState(false);

  useEffect(() => {
    fetchCheckinStatus();
  }, [jobId, user?.id]);

  const fetchCheckinStatus = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('qr_checkins')
      .select('*')
      .eq('job_id', jobId)
      .eq('worker_id', user.id)
      .maybeSingle();

    setCheckinData(data);
  };

  const calculateLateMinutes = () => {
    const startTime = new Date(jobStartTime);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return Math.max(0, diffMins);
  };

  const handleCheckin = async () => {
    if (!qrCode.trim()) {
      toast.error('Please enter the QR code');
      return;
    }

    setLoading(true);
    setVerifyingLocation(true);

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      const lateMinutes = calculateLateMinutes();

      // Check if QR code matches
      const { data: existingCheckin, error: fetchError } = await supabase
        .from('qr_checkins')
        .select('*')
        .eq('job_id', jobId)
        .eq('worker_id', user?.id)
        .maybeSingle();

      if (existingCheckin) {
        toast.error('You have already checked in for this job');
        setLoading(false);
        return;
      }

      // Create checkin record
      const { error } = await supabase
        .from('qr_checkins')
        .insert({
          job_id: jobId,
          worker_id: user?.id,
          qr_code: qrCode,
          checked_in_at: new Date().toISOString(),
          is_late: lateMinutes > 0,
          minutes_late: lateMinutes
        });

      if (error) throw error;

      // Also create safety checkin
      await supabase
        .from('safety_checkins')
        .insert({
          user_id: user?.id,
          job_id: jobId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          checkin_type: 'start'
        });

      toast.success(lateMinutes > 0 
        ? `Checked in (${lateMinutes} minutes late)` 
        : 'Checked in successfully!'
      );
      
      fetchCheckinStatus();
    } catch (error: any) {
      if (error.code === 1) {
        toast.error('Location access required for check-in');
      } else {
        toast.error('Failed to check in');
      }
    } finally {
      setLoading(false);
      setVerifyingLocation(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { error } = await supabase
        .from('qr_checkins')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', checkinData.id);

      if (error) throw error;

      // Safety checkout
      await supabase
        .from('safety_checkins')
        .insert({
          user_id: user?.id,
          job_id: jobId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          checkin_type: 'end'
        });

      toast.success('Checked out successfully!');
      fetchCheckinStatus();
    } catch (error) {
      toast.error('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  if (checkinData?.checked_out_at) {
    return (
      <Card className="border-border bg-emerald-500/5 border-emerald-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TickCircle size={24} variant="Bold" className="text-emerald-500" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Shift Completed</h4>
              <p className="text-sm text-muted-foreground">
                Checked out at {format(new Date(checkinData.checked_out_at), 'h:mm a')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (checkinData?.checked_in_at) {
    return (
      <Card className="border-border bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Timer1 size={24} variant="Bold" className="text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Currently Working</h4>
                <p className="text-sm text-muted-foreground">
                  Checked in at {format(new Date(checkinData.checked_in_at), 'h:mm a')}
                </p>
              </div>
            </div>
            {checkinData.is_late && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                <Clock size={12} className="mr-1" />
                {checkinData.minutes_late} min late
              </Badge>
            )}
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500"
          >
            {loading ? 'Processing...' : 'Check Out'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scan size={20} className="text-rose-500" />
          QR Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the QR code provided at the venue to check in
        </p>

        <div className="flex gap-2">
          <Input
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., WORK-1234)"
            className="uppercase"
          />
          <Button 
            onClick={handleCheckin}
            disabled={loading || !qrCode}
            className="bg-gradient-to-r from-rose-500 to-orange-500"
          >
            {loading ? (verifyingLocation ? 'Verifying...' : 'Checking...') : 'Check In'}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Location size={14} />
          <span>Your location will be verified during check-in</span>
        </div>

        {calculateLateMinutes() > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Warning2 size={16} />
            <span className="text-xs">You are {calculateLateMinutes()} minutes late. Check in now to minimize penalties.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCheckin;