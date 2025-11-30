import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Star1, Verify, BrifecaseTimer, Award } from 'iconsax-react';

const Profile = () => {
  return (
    <Layout title="My Profile">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-brand-red to-brand-orange text-white">
                  RK
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">Rahul Kumar</h2>
                    <Verify size={24} variant="Bold" className="text-brand-blue" />
                  </div>
                  <p className="text-muted-foreground">Student • Mumbai, Maharashtra</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star1 size={20} variant="Bold" className="text-yellow-500" />
                    <span className="font-semibold text-foreground">4.8</span>
                    <span className="text-sm text-muted-foreground">(32 reviews)</span>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Available
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="self-start sm:self-center">
                <Edit size={18} className="mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={BrifecaseTimer}
            label="Jobs Completed"
            value="47"
            gradient="from-brand-blue to-brand-cyan"
          />
          <StatCard
            icon={Award}
            label="Total Earned"
            value="₹38,400"
            gradient="from-brand-red to-brand-orange"
          />
          <StatCard
            icon={Star1}
            label="Average Rating"
            value="4.8"
            gradient="from-purple-500 to-pink-500"
          />
        </div>

        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {['Catering', 'Event Setup', 'Customer Service', 'Team Work', 'Communication'].map(
                (skill) => (
                  <Badge key={skill} variant="outline" className="text-sm">
                    {skill}
                  </Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-semibold text-foreground">About</h3>
            <p className="text-muted-foreground leading-relaxed">
              Dedicated and reliable student with 2+ years of experience in event catering and
              hospitality services. Strong communication skills and proven track record of
              professionalism. Available for weekend and evening shifts.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Recent Work History</h3>
            <div className="space-y-4">
              {[
                {
                  title: 'Wedding Event Server',
                  company: 'Grand Occasions',
                  date: 'Dec 15, 2024',
                  rating: 5,
                },
                {
                  title: 'Corporate Event Staff',
                  company: 'TechCorp Solutions',
                  date: 'Dec 10, 2024',
                  rating: 5,
                },
              ].map((work, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 pb-4 border-b border-border last:border-0"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">{work.title}</h4>
                    <p className="text-sm text-muted-foreground">{work.company}</p>
                    <p className="text-xs text-muted-foreground">{work.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star1 size={16} variant="Bold" className="text-yellow-500" />
                    <span className="text-sm font-semibold">{work.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
