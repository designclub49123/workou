import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Star1, Verify, BrifecaseTimer, Award, Location } from 'iconsax-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, earned: 0, rating: 0 });
  const [recentWork, setRecentWork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    phone: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSkills();
      fetchStats();
      fetchRecentWork();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*, skills(*)')
        .eq('user_id', user?.id);

      if (error) throw error;
      setSkills(data || []);
    } catch (error: any) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('applicant_id', user?.id)
        .eq('status', 'accepted');

      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('worker_payout')
        .eq('worker_id', user?.id)
        .eq('status', 'completed');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('rating, total_jobs_completed')
        .eq('id', user?.id)
        .single();

      const totalEarned = payments?.reduce((sum, p) => sum + (p.worker_payout || 0), 0) || 0;

      setStats({
        completed: profileData?.total_jobs_completed || applications?.length || 0,
        earned: totalEarned,
        rating: profileData?.rating || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentWork = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, jobs(*), ratings(*)')
        .eq('applicant_id', user?.id)
        .eq('status', 'accepted')
        .order('applied_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentWork(data || []);
    } catch (error: any) {
      console.error('Error fetching recent work:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editData)
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
      setEditOpen(false);
      fetchProfile();
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getVerificationBadge = () => {
    if (!profile) return null;
    const status = profile.verification_status;
    
    if (status === 'verified') {
      return <Verify size={24} variant="Bold" className="text-brand-blue" />;
    } else if (status === 'pending') {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Verification</Badge>;
    } else if (status === 'rejected') {
      return <Badge variant="outline" className="text-red-600 border-red-600">Verification Failed</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">Not Verified</Badge>;
  };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="w-24 h-24">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-brand-red to-brand-orange text-white">
                  {getInitials(profile?.full_name || 'User')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">
                      {profile?.full_name || 'User'}
                    </h2>
                    {getVerificationBadge()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {profile?.city && profile?.state && (
                      <>
                        <Location size={16} />
                        <span>{profile.city}, {profile.state}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star1 size={20} variant="Bold" className="text-yellow-500" />
                    <span className="font-semibold text-foreground">{stats.rating.toFixed(1)}</span>
                  </div>
                  <Badge className={profile?.is_available ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}>
                    {profile?.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="self-start sm:self-center">
                    <Edit size={18} className="mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={editData.full_name}
                        onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={editData.state}
                        onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleUpdateProfile} className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={BrifecaseTimer}
            label="Jobs Completed"
            value={stats.completed.toString()}
            gradient="from-brand-blue to-brand-cyan"
          />
          <StatCard
            icon={Award}
            label="Total Earned"
            value={`₹${stats.earned.toLocaleString()}`}
            gradient="from-brand-red to-brand-orange"
          />
          <StatCard
            icon={Star1}
            label="Average Rating"
            value={stats.rating.toFixed(1)}
            gradient="from-purple-500 to-pink-500"
          />
        </div>

        {skills.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((userSkill) => (
                  <Badge key={userSkill.id} variant="outline" className="text-sm">
                    {userSkill.skills.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.bio && (
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-foreground">About</h3>
              <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {recentWork.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Recent Work History</h3>
              <div className="space-y-4">
                {recentWork.map((work) => (
                  <div
                    key={work.id}
                    className="flex items-start justify-between gap-4 pb-4 border-b border-border last:border-0"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">{work.jobs.title}</h4>
                      <p className="text-sm text-muted-foreground">{work.jobs.location}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(work.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    {work.ratings && work.ratings.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Star1 size={16} variant="Bold" className="text-yellow-500" />
                        <span className="text-sm font-semibold">{work.ratings[0].rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: any;
  label: string;
  value: string;
  gradient: string;
}) => (
  <Card className="border-border">
    <CardContent className="p-6 space-y-3">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon size={24} variant="Bold" className="text-white" />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default Profile;
