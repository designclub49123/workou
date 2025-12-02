import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Edit, Star1, Verify, BrifecaseTimer, Award, Location, 
  Calendar, Clock, Shield, Medal, TrendUp, DocumentText,
  Call, Sms, Setting2
} from 'iconsax-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, earned: 0, rating: 0, pending: 0 });
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
      const { data: applications } = await supabase
        .from('job_applications')
        .select('*')
        .eq('applicant_id', user?.id);

      const completedApps = applications?.filter(a => a.status === 'accepted') || [];
      const pendingApps = applications?.filter(a => a.status === 'pending') || [];

      const { data: payments } = await supabase
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
        completed: profileData?.total_jobs_completed || completedApps.length,
        earned: totalEarned,
        rating: profileData?.rating || 0,
        pending: pendingApps.length,
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
        .select('*, jobs(*)')
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

  const getVerificationStatus = () => {
    if (!profile) return { icon: Shield, text: 'Not Verified', color: 'text-muted-foreground', bg: 'bg-muted' };
    const status = profile.verification_status;
    
    if (status === 'verified') {
      return { icon: Verify, text: 'Verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    } else if (status === 'pending') {
      return { icon: Clock, text: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    }
    return { icon: Shield, text: 'Not Verified', color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const profileCompletion = () => {
    let score = 0;
    if (profile?.full_name) score += 20;
    if (profile?.phone) score += 20;
    if (profile?.city && profile?.state) score += 20;
    if (profile?.bio) score += 20;
    if (skills.length > 0) score += 20;
    return score;
  };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      </Layout>
    );
  }

  const verification = getVerificationStatus();
  const completion = profileCompletion();

  return (
    <Layout title="My Profile">
      <div className="container mx-auto px-4 py-6 space-y-6 pb-24 md:pb-6">
        {/* Profile Header Card */}
        <Card className="border-0 bg-gradient-to-br from-rose-500 to-orange-500 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAyLTQgMiAyIDQgMiA0IDIgMiA0IDIgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
          <CardContent className="p-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-white/30 shadow-xl">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="text-3xl font-bold bg-white/20 text-white">
                    {getInitials(profile?.full_name || 'User')}
                  </AvatarFallback>
                </Avatar>
                {profile?.verification_status === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg">
                    <Verify size={20} variant="Bold" className="text-emerald-500" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 opacity-90">
                    {profile?.city && profile?.state && (
                      <>
                        <Location size={16} />
                        <span className="text-sm">{profile.city}, {profile.state}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Star1 size={16} variant="Bold" className="text-yellow-300" />
                    <span className="font-semibold text-sm">{stats.rating.toFixed(1)}</span>
                  </div>
                  <Badge className={`${profile?.is_available ? 'bg-emerald-500' : 'bg-white/20'} text-white border-0`}>
                    {profile?.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-0 capitalize">
                    {userRole || 'user'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="bg-white/20 hover:bg-white/30 text-white rounded-full">
                      <Edit size={18} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
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
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                      <div>
                        <Label>Bio</Label>
                        <Textarea
                          value={editData.bio}
                          onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                          rows={4}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <Button onClick={handleUpdateProfile} className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full"
                  onClick={() => navigate('/settings')}
                >
                  <Setting2 size={18} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion */}
        {completion < 100 && (
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Profile Completion</span>
                <span className="text-sm font-bold text-rose-500">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Complete your profile to get more job opportunities
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          <QuickAction icon={DocumentText} label="Applications" onClick={() => navigate('/applications')} />
          <QuickAction icon={Calendar} label="Availability" onClick={() => navigate('/worker-availability')} />
          <QuickAction icon={Sms} label="Messages" onClick={() => navigate('/messages')} />
          <QuickAction icon={Call} label="Support" onClick={() => toast.info('Support coming soon!')} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={BrifecaseTimer}
            label="Jobs Completed"
            value={stats.completed.toString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={Award}
            label="Total Earned"
            value={`₹${stats.earned.toLocaleString()}`}
            color="bg-emerald-500"
          />
          <StatCard
            icon={Star1}
            label="Average Rating"
            value={stats.rating.toFixed(1)}
            color="bg-amber-500"
          />
          <StatCard
            icon={Clock}
            label="Pending Apps"
            value={stats.pending.toString()}
            color="bg-purple-500"
          />
        </div>

        {/* Verification Status */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${verification.bg}`}>
                  <verification.icon size={20} variant="Bold" className={verification.color} />
                </div>
                <div>
                  <p className="font-medium text-foreground">Verification Status</p>
                  <p className={`text-sm ${verification.color}`}>{verification.text}</p>
                </div>
              </div>
              {profile?.verification_status !== 'verified' && (
                <Button variant="outline" size="sm" onClick={() => toast.info('KYC verification coming soon!')}>
                  Verify Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        {skills.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Skills</h3>
                <Button variant="ghost" size="sm" className="text-rose-500">
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((userSkill) => (
                  <Badge 
                    key={userSkill.id} 
                    variant="outline" 
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-rose-500/5 to-orange-500/5 border-rose-500/20"
                  >
                    {userSkill.skills.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bio Section */}
        {profile?.bio && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">About Me</h3>
              <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Work */}
        {recentWork.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Recent Work</h3>
                <Button variant="ghost" size="sm" className="text-rose-500">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {recentWork.map((work) => (
                  <div
                    key={work.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                      <BrifecaseTimer size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{work.jobs.title}</h4>
                      <p className="text-xs text-muted-foreground">{work.jobs.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">₹{work.jobs.wage_per_hour}/hr</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(work.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        {(profile?.phone || user?.email) && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
              <div className="space-y-2">
                {user?.email && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Sms size={18} />
                    <span className="text-sm">{user.email}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Call size={18} />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
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
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) => (
  <Card className="border-border">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={20} variant="Bold" className="text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
  >
    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500/10 to-orange-500/10 flex items-center justify-center">
      <Icon size={20} className="text-rose-500" />
    </div>
    <span className="text-xs font-medium text-foreground">{label}</span>
  </button>
);

export default Profile;