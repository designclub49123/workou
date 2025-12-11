import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Building, Crown, TickCircle, Clock, CloseCircle } from 'iconsax-react';

const BecomeOrganizer = () => {
  const { user, userRole, refreshUserRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    reason: ''
  });

  useEffect(() => {
    if (user) {
      fetchExistingRequest();
    }
  }, [user]);

  const fetchExistingRequest = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setExistingRequest(data);
      }
    } catch (error) {
      // No existing request
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('role_requests')
        .insert({
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          reason: formData.reason
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted!',
        description: 'Your request to become an organizer has been submitted for review.',
      });

      fetchExistingRequest();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (userRole === 'organizer' || userRole === 'admin') {
    return (
      <Layout title="Become an Organizer">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Crown size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You're Already an Organizer!</h2>
              <p className="text-muted-foreground mb-6">
                You have full access to post jobs and manage applications.
              </p>
              <Button onClick={() => window.location.href = '/post-job'} className="gradient-primary">
                Post a Job Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (existingRequest) {
    return (
      <Layout title="Become an Organizer">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building size={24} />
              Your Application Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {existingRequest.status === 'pending' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                    <Clock size={40} className="text-yellow-500" />
                  </div>
                  <Badge className="bg-yellow-500/10 text-yellow-500 mb-4">Pending Review</Badge>
                  <h2 className="text-xl font-bold mb-2">Application Under Review</h2>
                  <p className="text-muted-foreground">
                    Your request is being reviewed by our team. You'll be notified once a decision is made.
                  </p>
                </>
              )}
              {existingRequest.status === 'approved' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <TickCircle size={40} className="text-green-500" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-500 mb-4">Approved</Badge>
                  <h2 className="text-xl font-bold mb-2">Congratulations!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your application has been approved. Please refresh the page to access organizer features.
                  </p>
                  <Button onClick={() => {
                    refreshUserRole();
                    window.location.reload();
                  }} className="gradient-primary">
                    Refresh Access
                  </Button>
                </>
              )}
              {existingRequest.status === 'rejected' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <CloseCircle size={40} className="text-red-500" />
                  </div>
                  <Badge className="bg-red-500/10 text-red-500 mb-4">Rejected</Badge>
                  <h2 className="text-xl font-bold mb-2">Application Not Approved</h2>
                  <p className="text-muted-foreground">
                    Unfortunately, your application was not approved at this time. You may contact support for more information.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Your Application Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Business Name:</span> {existingRequest.business_name}</p>
                <p><span className="text-muted-foreground">Business Type:</span> {existingRequest.business_type}</p>
                <p><span className="text-muted-foreground">Submitted:</span> {new Date(existingRequest.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Become an Organizer">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown size={24} className="text-yellow-500" />
              Become an Organizer
            </CardTitle>
            <CardDescription>
              Post jobs, manage workers, and grow your business with WorkNexus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-muted rounded-lg text-center">
                <h3 className="font-semibold mb-1">Post Jobs</h3>
                <p className="text-sm text-muted-foreground">Create and manage job listings</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <h3 className="font-semibold mb-1">Hire Workers</h3>
                <p className="text-sm text-muted-foreground">Review and approve applications</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <h3 className="font-semibold mb-1">Track Progress</h3>
                <p className="text-sm text-muted-foreground">Monitor attendance & payments</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business/Company Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Select
                  value={formData.business_type}
                  onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event_management">Event Management</SelectItem>
                    <SelectItem value="catering">Catering Services</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="warehouse">Warehouse & Logistics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Why do you want to become an organizer?</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Tell us about your hiring needs and how you plan to use WorkNexus"
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BecomeOrganizer;
