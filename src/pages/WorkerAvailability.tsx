import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, TickCircle } from 'iconsax-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailabilitySlot {
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

const WorkerAvailability = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    DAYS.map((_, index) => ({
      day_of_week: index,
      is_available: index !== 0, // Default: available Mon-Sat
      start_time: '09:00',
      end_time: '18:00'
    }))
  );

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('worker_availability')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setAvailability(prev => 
          prev.map(slot => {
            const existing = data.find(d => d.day_of_week === slot.day_of_week);
            if (existing) {
              return {
                day_of_week: existing.day_of_week,
                is_available: existing.is_available ?? true,
                start_time: existing.start_time || '09:00',
                end_time: existing.end_time || '18:00'
              };
            }
            return slot;
          })
        );
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Delete existing and insert new
      await supabase
        .from('worker_availability')
        .delete()
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('worker_availability')
        .insert(
          availability.map(slot => ({
            user_id: user.id,
            day_of_week: slot.day_of_week,
            is_available: slot.is_available,
            start_time: slot.start_time,
            end_time: slot.end_time
          }))
        );

      if (error) throw error;

      toast({
        title: 'Availability saved',
        description: 'Your weekly availability has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save availability',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (dayIndex: number, field: keyof AvailabilitySlot, value: any) => {
    setAvailability(prev =>
      prev.map(slot =>
        slot.day_of_week === dayIndex ? { ...slot, [field]: value } : slot
      )
    );
  };

  if (loading) {
    return (
      <Layout title="My Availability">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Availability">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={24} />
              Weekly Availability
            </CardTitle>
            <CardDescription>
              Set your available hours for each day of the week. This helps organizers find workers matching their job schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availability.map((slot) => (
              <div
                key={slot.day_of_week}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 sm:w-40">
                  <Switch
                    checked={slot.is_available}
                    onCheckedChange={(checked) => updateSlot(slot.day_of_week, 'is_available', checked)}
                  />
                  <Label className="font-medium">{DAYS[slot.day_of_week]}</Label>
                </div>

                {slot.is_available && (
                  <div className="flex items-center gap-2 flex-1">
                    <Clock size={16} className="text-muted-foreground" />
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(slot.day_of_week, 'start_time', e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(slot.day_of_week, 'end_time', e.target.value)}
                      className="w-28"
                    />
                  </div>
                )}

                {!slot.is_available && (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>
            ))}

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full gradient-primary mt-4"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <TickCircle size={18} className="mr-2" />
                  Save Availability
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tips for Better Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <TickCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                Keep your availability up to date for accurate job recommendations
              </li>
              <li className="flex items-start gap-2">
                <TickCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                Be flexible with timings to increase your chances of getting hired
              </li>
              <li className="flex items-start gap-2">
                <TickCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                Organizers can see your availability when reviewing applications
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WorkerAvailability;
