import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import VerificationSection from '@/components/profile/VerificationSection';
import ReliabilityScore from '@/components/profile/ReliabilityScore';
import SafetySettings from '@/components/profile/SafetySettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Verify, Chart } from 'iconsax-react';

const Verification = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
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
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Verification">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Verification & Safety">
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full bg-muted/50">
            <TabsTrigger value="verification" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <Verify size={16} />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger value="reliability" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Chart size={16} />
              <span className="hidden sm:inline">Reliability</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <Shield size={16} />
              <span className="hidden sm:inline">Safety</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="animate-fade-in">
            <VerificationSection profile={profile} onUpdate={fetchProfile} />
          </TabsContent>

          <TabsContent value="reliability" className="animate-fade-in">
            <ReliabilityScore profile={profile} />
          </TabsContent>

          <TabsContent value="safety" className="animate-fade-in">
            <SafetySettings profile={profile} userId={user?.id || ''} onUpdate={fetchProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Verification;