import { Verify, MoneyRecive, SecurityUser, Star1 } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Verify,
    title: 'Verified Profiles',
    description: 'KYC-verified students and organizers for trusted connections.',
    gradient: 'from-brand-blue to-brand-cyan',
  },
  {
    icon: MoneyRecive,
    title: 'Fair Compensation',
    description: 'Transparent payment system ensuring workers get what they deserve.',
    gradient: 'from-brand-red to-brand-orange',
  },
  {
    icon: SecurityUser,
    title: 'Secure Platform',
    description: 'Your data and transactions protected with enterprise-grade security.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Star1,
    title: 'Rating System',
    description: 'Build your reputation with verified reviews and ratings.',
    gradient: 'from-green-500 to-emerald-500',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Why Choose WorkNexus?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for students and event organizers with features that matter most
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:shadow-lg smooth-transition">
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                  <feature.icon size={24} variant="Bold" className="text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
