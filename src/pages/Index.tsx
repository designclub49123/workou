import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CTASection from '@/components/home/CTASection';
import Layout from '@/components/layout/Layout';

const Index = () => {
  return (
    <Layout title="WorkNexus" showTopBar={false}>
      <div className="space-y-0">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </div>
    </Layout>
  );
};

export default Index;
