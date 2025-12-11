import { SearchNormal1, ArrowRight } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-accent/30 to-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-brand-red via-rose-500 to-brand-orange bg-clip-text text-transparent">
                Connect Students
              </span>
              <br />
              <span className="text-foreground">With Event Opportunities</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Fair pay. Verified profiles. Reliable workforce. The future of part-time event staffing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search for jobs, events, or categories..."
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button size="lg" className="h-12 px-6 bg-gradient-to-r from-brand-red to-brand-orange hover:opacity-90 text-white font-semibold">
              Search Jobs
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <StatCard value="10,000+" label="Active Students" />
            <StatCard value="500+" label="Event Organizers" />
            <StatCard value="25,000+" label="Jobs Completed" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
};

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-card border border-border rounded-lg px-6 py-3">
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default HeroSection;
