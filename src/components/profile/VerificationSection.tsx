import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Verify, DocumentText, Camera, 
  TickCircle, CloseCircle, Clock
} from 'iconsax-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerificationSectionProps {
  profile: any;
  onUpdate: () => void;
}

const VerificationSection = ({ profile, onUpdate }: VerificationSectionProps) => {
  const [uploading, setUploading] = useState<string | null>(null);

  const verificationItems = [
    {
      id: 'aadhaar',
      label: 'Aadhaar Card',
      verified: profile?.aadhaar_verified,
      url: profile?.aadhaar_url,
      icon: DocumentText,
      description: 'Upload your Aadhaar card for identity verification'
    },
    {
      id: 'college',
      label: 'College ID',
      verified: profile?.college_id_verified,
      url: profile?.college_id_url,
      icon: DocumentText,
      description: 'Upload your college ID to verify student status'
    },
    {
      id: 'face',
      label: 'Face Photo',
      verified: profile?.face_verified,
      url: profile?.face_photo_url,
      icon: Camera,
      description: 'Take a selfie for facial verification'
    }
  ];

  const completedCount = verificationItems.filter(item => item.verified).length;
  const verificationProgress = (completedCount / verificationItems.length) * 100;

  const handleFileUpload = async (type: string, file: File) => {
    if (!file) return;

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const updateField = type === 'aadhaar' ? 'aadhaar_url' : 
                          type === 'college' ? 'college_id_url' : 'face_photo_url';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: urlData.publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success(`${type === 'aadhaar' ? 'Aadhaar' : type === 'college' ? 'College ID' : 'Face photo'} uploaded for verification`);
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setUploading(null);
    }
  };

  const getStatusBadge = (verified: boolean, url: string | null) => {
    if (verified) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <TickCircle size={14} className="mr-1" /> Verified
        </Badge>
      );
    }
    if (url) {
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Clock size={14} className="mr-1" /> Pending Review
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CloseCircle size={14} className="mr-1" /> Not Submitted
      </Badge>
    );
  };

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Verify size={24} variant="Bold" />
            </div>
            <div>
              <CardTitle className="text-lg">Identity Verification</CardTitle>
              <p className="text-sm text-white/80">Complete verification to unlock more opportunities</p>
            </div>
          </div>
          {completedCount === verificationItems.length && (
            <Badge className="bg-white text-emerald-600 border-0">
              <Shield size={14} className="mr-1" /> Fully Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Verification Progress</span>
            <span className="font-medium text-foreground">{completedCount}/{verificationItems.length}</span>
          </div>
          <Progress value={verificationProgress} className="h-2" />
        </div>

        {/* Verification Items */}
        <div className="space-y-3">
          {verificationItems.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${item.verified ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    <item.icon 
                      size={20} 
                      variant="Bold" 
                      className={item.verified ? 'text-emerald-500' : 'text-muted-foreground'} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{item.label}</h4>
                      {getStatusBadge(item.verified, item.url)}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                
                {!item.verified && (
                  <div>
                    <Label 
                      htmlFor={`upload-${item.id}`}
                      className="cursor-pointer"
                    >
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={uploading === item.id}
                        asChild
                      >
                        <span>
                          {uploading === item.id ? 'Uploading...' : item.url ? 'Re-upload' : 'Upload'}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id={`upload-${item.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(item.id, file);
                      }}
                    />
                  </div>
                )}
              </div>

              {item.url && !item.verified && (
                <div className="mt-3 pt-3 border-t border-border">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-rose-500 hover:underline"
                  >
                    View uploaded document →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* College Name Input */}
        <div className="space-y-2">
          <Label htmlFor="college_name">College/University Name</Label>
          <Input
            id="college_name"
            placeholder="Enter your college name"
            defaultValue={profile?.college_name || ''}
            onBlur={async (e) => {
              if (e.target.value !== profile?.college_name) {
                await supabase
                  .from('profiles')
                  .update({ college_name: e.target.value })
                  .eq('id', profile.id);
                toast.success('College name updated');
                onUpdate();
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationSection;