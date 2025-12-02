import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { TickCircle, CloseCircle, Clock, Building } from 'iconsax-react';
import { format } from 'date-fns';

interface RoleRequest {
  id: string;
  user_id: string;
  status: string;
  business_name: string;
  business_type: string;
  reason: string;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string;
    email?: string;
  };
}

const ManageRoleRequests = () => {
  const { userRole } = useAuth();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles
      const enrichedRequests = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', req.user_id)
            .single();

          return {
            ...req,
            profile: profileData
          };
        })
      );

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: RoleRequest) => {
    setProcessing(request.id);
    try {
      // Add organizer role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: 'organizer'
        });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      // Update request status
      const { error: updateError } = await supabase
        .from('role_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          title: 'Organizer Request Approved! 🎉',
          message: 'Congratulations! Your request to become an organizer has been approved. You can now post jobs!',
          type: 'role_approved'
        });

      toast({
        title: 'Request Approved',
        description: `${request.profile?.full_name} is now an organizer.`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive'
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: RoleRequest) => {
    setProcessing(request.id);
    try {
      const { error } = await supabase
        .from('role_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', request.id);

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          title: 'Organizer Request Update',
          message: 'Your request to become an organizer has been reviewed. Please contact support for more information.',
          type: 'role_rejected'
        });

      toast({
        title: 'Request Rejected',
        description: 'The request has been rejected.',
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive'
      });
    } finally {
      setProcessing(null);
    }
  };

  if (userRole !== 'admin') {
    return (
      <Layout title="Access Denied">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CloseCircle size={48} className="mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only administrators can access this page.</p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Layout title="Manage Role Requests">
      <div className="space-y-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} className="text-yellow-500" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building size={48} className="mx-auto mb-2 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {request.profile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{request.profile?.full_name}</h3>
                          <Badge variant="secondary">{request.business_type}</Badge>
                        </div>
                        <p className="text-sm font-medium">{request.business_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted: {format(new Date(request.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={processing === request.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <TickCircle size={18} className="mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(request)}
                        disabled={processing === request.id}
                        className="flex-1"
                      >
                        <CloseCircle size={18} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {processedRequests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No processed requests yet
              </div>
            ) : (
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {request.profile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{request.profile?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{request.business_name}</p>
                      </div>
                    </div>
                    <Badge className={
                      request.status === 'approved' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManageRoleRequests;
