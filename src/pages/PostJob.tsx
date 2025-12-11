import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    city: '',
    state: '',
    event_type: '',
    workers_needed: 1,
    wage_per_hour: 0,
    total_hours: 0,
    is_urgent: false,
    meal_provided: false,
    transportation_provided: false,
    dress_code: '',
    requirements: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      const requirementsArray = formData.requirements
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const { error } = await supabase.from('jobs').insert({
        organizer_id: user.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        event_type: formData.event_type,
        workers_needed: formData.workers_needed,
        wage_per_hour: formData.wage_per_hour,
        total_hours: formData.total_hours,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_urgent: formData.is_urgent,
        meal_provided: formData.meal_provided,
        transportation_provided: formData.transportation_provided,
        dress_code: formData.dress_code,
        requirements: requirementsArray,
        status: 'open',
      });

      if (error) throw error;

      toast.success('Job posted successfully!');
      navigate('/jobs');
    } catch (error: any) {
      toast.error('Failed to post job');
      console.error('Error posting job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Post a Job">
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
              Create New Job Posting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Wedding Event Server"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    placeholder="Describe the job responsibilities and requirements..."
                  />
                </div>

                <div>
                  <Label htmlFor="event_type">Event Type *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Birthday">Birthday Party</SelectItem>
                      <SelectItem value="Festival">Festival</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workers_needed">Workers Needed *</Label>
                  <Input
                    id="workers_needed"
                    type="number"
                    min="1"
                    value={formData.workers_needed}
                    onChange={(e) => setFormData({ ...formData, workers_needed: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="wage_per_hour">Wage per Hour (₹) *</Label>
                  <Input
                    id="wage_per_hour"
                    type="number"
                    min="0"
                    value={formData.wage_per_hour}
                    onChange={(e) => setFormData({ ...formData, wage_per_hour: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="total_hours">Total Hours *</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="location">Location Address *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    placeholder="Full address of the event"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="dress_code">Dress Code</Label>
                  <Input
                    id="dress_code"
                    value={formData.dress_code}
                    onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                    placeholder="e.g., Formal black and white"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="requirements">Requirements (comma-separated)</Label>
                  <Input
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="e.g., Previous experience, Good communication, Physical fitness"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_urgent"
                    checked={formData.is_urgent}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked })}
                  />
                  <Label htmlFor="is_urgent">Mark as Urgent</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="meal_provided"
                    checked={formData.meal_provided}
                    onCheckedChange={(checked) => setFormData({ ...formData, meal_provided: checked })}
                  />
                  <Label htmlFor="meal_provided">Meal Provided</Label>
                </div>

                <div className="flex items-center space-x-2 md:col-span-2">
                  <Switch
                    id="transportation_provided"
                    checked={formData.transportation_provided}
                    onCheckedChange={(checked) => setFormData({ ...formData, transportation_provided: checked })}
                  />
                  <Label htmlFor="transportation_provided">Transportation Provided</Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Posting...' : 'Post Job'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PostJob;
