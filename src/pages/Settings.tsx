import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Notification,
  SecurityUser,
  Eye,
  ShieldTick,
  Translate,
  InfoCircle,
  ArrowRight,
} from 'iconsax-react';

const Settings = () => {
  const settingsSections = [
    {
      title: 'Notifications',
      icon: Notification,
      items: [
        { label: 'Job Alerts', description: 'Get notified about new job opportunities', enabled: true },
        { label: 'Messages', description: 'Notifications for new messages', enabled: true },
        { label: 'Payments', description: 'Updates about payments and earnings', enabled: true },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: SecurityUser,
      items: [
        { label: 'Profile Visibility', description: 'Show profile to organizers', enabled: true },
        { label: 'Two-Factor Authentication', description: 'Add extra security', enabled: false },
      ],
    },
  ];

  return (
    <Layout title="Settings">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">App Settings</h2>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>

        {settingsSections.map((section) => (
          <Card key={section.title} className="border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center">
                  <section.icon size={20} variant="Bold" className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
              </div>

              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 pb-4 border-b border-border last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-red to-brand-orange flex items-center justify-center">
                <ShieldTick size={20} variant="Bold" className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Account</h3>
            </div>

            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-3">
                  <Eye size={20} variant="Outline" />
                  <span>Change Password</span>
                </div>
                <ArrowRight size={18} />
              </Button>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-3">
                  <Translate size={20} variant="Outline" />
                  <span>Language Preferences</span>
                </div>
                <ArrowRight size={18} />
              </Button>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-3">
                  <InfoCircle size={20} variant="Outline" />
                  <span>Help & Support</span>
                </div>
                <ArrowRight size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-4">
          <p>WorkNexus v1.0.0</p>
          <p className="mt-1">© 2024 All rights reserved</p>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
