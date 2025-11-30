import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Location, Clock, MoneyRecive, ArrowRight } from 'iconsax-react';

const mockJobs = [
  {
    id: 1,
    title: 'Wedding Event Server',
    company: 'Grand Occasions',
    location: 'Mumbai, Maharashtra',
    pay: '₹800/day',
    duration: '6 hours',
    category: 'Catering',
    urgent: true,
  },
  {
    id: 2,
    title: 'Corporate Event Staff',
    company: 'TechCorp Solutions',
    location: 'Bangalore, Karnataka',
    pay: '₹1000/day',
    duration: '8 hours',
    category: 'Corporate',
    urgent: false,
  },
  {
    id: 3,
    title: 'Birthday Party Helper',
    company: 'Celebration Planners',
    location: 'Delhi NCR',
    pay: '₹600/day',
    duration: '4 hours',
    category: 'Private Events',
    urgent: false,
  },
  {
    id: 4,
    title: 'Festival Volunteer',
    company: 'City Events Org',
    location: 'Pune, Maharashtra',
    pay: '₹700/day',
    duration: '10 hours',
    category: 'Community',
    urgent: true,
  },
];

const Jobs = () => {
  return (
    <Layout title="Browse Jobs">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Available Opportunities</h2>
          <p className="text-muted-foreground">Find your next part-time gig</p>
        </div>

        <div className="space-y-4">
          {mockJobs.map((job) => (
            <Card key={job.id} className="border-border hover:shadow-md smooth-transition">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                        {job.urgent && (
                          <Badge className="bg-brand-red text-white">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{job.company}</p>
                    </div>
                    <Badge variant="outline">{job.category}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Location size={18} variant="Bold" className="text-brand-blue" />
                      <span className="text-muted-foreground">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={18} variant="Bold" className="text-brand-orange" />
                      <span className="text-muted-foreground">{job.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MoneyRecive size={18} variant="Bold" className="text-green-500" />
                      <span className="font-semibold text-foreground">{job.pay}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 sm:flex-none">
                      Apply Now
                      <ArrowRight size={18} className="ml-2" />
                    </Button>
                    <Button variant="outline">View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Jobs;
