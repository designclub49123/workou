import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity, BrifecaseTimer, TickCircle, CloseCircle, Clock, User, Star1 } from 'iconsax-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  related_id: string | null;
  created_at: string;
}

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job_application':
        return <BrifecaseTimer size={20} variant="Bold" className="text-primary" />;
      case 'application_accepted':
        return <TickCircle size={20} variant="Bold" className="text-green-500" />;
      case 'application_rejected':
        return <CloseCircle size={20} variant="Bold" className="text-red-500" />;
      case 'profile_update':
        return <User size={20} variant="Bold" className="text-blue-500" />;
      case 'rating_received':
        return <Star1 size={20} variant="Bold" className="text-yellow-500" />;
      default:
        return <Activity size={20} variant="Bold" className="text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'job_application':
        return 'bg-primary/10 border-primary/20';
      case 'application_accepted':
        return 'bg-green-500/10 border-green-500/20';
      case 'application_rejected':
        return 'bg-red-500/10 border-red-500/20';
      case 'profile_update':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'rating_received':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-muted border-border';
    }
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups: { [key: string]: ActivityItem[] }, activity) => {
    const date = format(new Date(activity.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
  };

  if (loading) {
    return (
      <Layout title="Activity Feed">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Activity Feed">
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Activity Feed</h2>
          <p className="text-sm text-muted-foreground">Your recent activities and updates</p>
        </div>

        {/* Activity Timeline */}
        {activities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Activity size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No activities yet</p>
                <p className="text-sm text-muted-foreground">
                  Your activities will appear here as you use the app
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2">
                  {getDateLabel(date)}
                </h3>
                <div className="space-y-3 relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />
                  
                  {dayActivities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3 sm:gap-4 relative">
                      {/* Icon */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full border flex items-center justify-center ${getActivityColor(activity.activity_type)} z-10 bg-background`}>
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <Card className="border-border">
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-1">
                              <h4 className="text-sm sm:text-base font-medium text-foreground">
                                {activity.title}
                              </h4>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground">
                                  {activity.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ActivityFeed;
