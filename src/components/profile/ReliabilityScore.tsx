import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Chart, TrendUp, TrendDown, Clock, Warning2,
  TickCircle, Star1, Medal
} from 'iconsax-react';

interface ReliabilityScoreProps {
  profile: any;
}

const ReliabilityScore = ({ profile }: ReliabilityScoreProps) => {
  const score = profile?.reliability_score || 100;
  const noShows = profile?.total_no_shows || 0;
  const lateArrivals = profile?.total_late_arrivals || 0;
  const jobsCompleted = profile?.total_jobs_completed || 0;

  const getScoreColor = () => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = () => {
    if (score >= 90) return 'from-emerald-500 to-teal-500';
    if (score >= 70) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getScoreLabel = () => {
    if (score >= 95) return { label: 'Excellent', icon: Medal };
    if (score >= 85) return { label: 'Great', icon: Star1 };
    if (score >= 70) return { label: 'Good', icon: TrendUp };
    if (score >= 50) return { label: 'Fair', icon: TrendDown };
    return { label: 'Needs Improvement', icon: Warning2 };
  };

  const scoreInfo = getScoreLabel();

  const metrics = [
    {
      label: 'Jobs Completed',
      value: jobsCompleted,
      icon: TickCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'No Shows',
      value: noShows,
      icon: Warning2,
      color: noShows > 0 ? 'text-red-500' : 'text-muted-foreground',
      bg: noShows > 0 ? 'bg-red-500/10' : 'bg-muted'
    },
    {
      label: 'Late Arrivals',
      value: lateArrivals,
      icon: Clock,
      color: lateArrivals > 0 ? 'text-amber-500' : 'text-muted-foreground',
      bg: lateArrivals > 0 ? 'bg-amber-500/10' : 'bg-muted'
    }
  ];

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className={`bg-gradient-to-r ${getScoreBg()} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Chart size={24} variant="Bold" />
            </div>
            <div>
              <CardTitle className="text-lg">Reliability Score</CardTitle>
              <p className="text-sm text-white/80">Your performance rating</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0">
            <scoreInfo.icon size={14} className="mr-1" />
            {scoreInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Score Display */}
        <div className="text-center py-4">
          <div className={`text-5xl font-bold ${getScoreColor()}`}>
            {score}
          </div>
          <p className="text-sm text-muted-foreground mt-1">out of 100</p>
          <Progress 
            value={score} 
            className="h-3 mt-4 mx-auto max-w-xs" 
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((metric) => (
            <div 
              key={metric.label}
              className={`p-3 rounded-xl ${metric.bg} text-center`}
            >
              <metric.icon size={20} variant="Bold" className={`${metric.color} mx-auto mb-1`} />
              <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <h4 className="font-medium text-sm text-foreground mb-2">Tips to Improve Score</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Always arrive on time or early</li>
            <li>• Communicate if you need to cancel</li>
            <li>• Complete jobs professionally</li>
            <li>• Get good ratings from organizers</li>
          </ul>
        </div>

        {/* Backup Pool Status */}
        {profile?.backup_pool_member && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Medal size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-foreground">Backup Pool Member</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You're eligible to be called as backup for urgent job openings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReliabilityScore;