import { ArrowRight, UserAdd } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-card via-accent/50 to-card border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 via-transparent to-brand-blue/10" />
          <div className="relative p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of students and event organizers already using WorkNexus
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-brand-red to-brand-orange hover:opacity-90 text-white font-semibold">
                <UserAdd size={20} className="mr-2" />
                Sign Up as Student
              </Button>
              <Button size="lg" variant="outline" className="border-2">
                Join as Organizer
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CTASection;
