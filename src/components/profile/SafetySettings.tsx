import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Location, Moon, Call, Add, Trash,
  Gps, Warning2, TickCircle
} from 'iconsax-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SafetySettingsProps {
  profile: any;
  userId: string;
  onUpdate: () => void;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  is_primary: boolean;
}

const SafetySettings = ({ profile, userId, onUpdate }: SafetySettingsProps) => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmergencyContacts();
  }, [userId]);

  const fetchEmergencyContacts = async () => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (!error && data) {
      setEmergencyContacts(data);
    }
  };

  const handleUpdateProfile = async (field: string, value: any) => {
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update setting');
    } else {
      toast.success('Setting updated');
      onUpdate();
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: userId,
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship,
        is_primary: emergencyContacts.length === 0
      });

    if (error) {
      toast.error('Failed to add contact');
    } else {
      toast.success('Emergency contact added');
      setNewContact({ name: '', relationship: '', phone: '' });
      setAddDialogOpen(false);
      fetchEmergencyContacts();
    }
    setLoading(false);
  };

  const handleDeleteContact = async (id: string) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete contact');
    } else {
      toast.success('Contact removed');
      fetchEmergencyContacts();
    }
  };

  const handleSetPrimary = async (id: string) => {
    // First, unset all as primary
    await supabase
      .from('emergency_contacts')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Then set the selected one as primary
    const { error } = await supabase
      .from('emergency_contacts')
      .update({ is_primary: true })
      .eq('id', id);

    if (!error) {
      toast.success('Primary contact updated');
      fetchEmergencyContacts();
    }
  };

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Shield size={24} variant="Bold" />
          </div>
          <div>
            <CardTitle className="text-lg">Safety Settings</CardTitle>
            <p className="text-sm text-white/80">Manage your safety preferences</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Emergency Contacts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Call size={18} className="text-rose-500" />
              <Label className="text-foreground font-medium">Emergency Contacts</Label>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Add size={16} className="mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Select
                      value={newContact.relationship}
                      onValueChange={(v) => setNewContact({ ...newContact, relationship: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <Button 
                    onClick={handleAddContact} 
                    className="w-full bg-gradient-to-r from-rose-500 to-orange-500"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Contact'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {emergencyContacts.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <Warning2 size={18} className="text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  No emergency contacts added. Add at least one for your safety.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <div 
                  key={contact.id}
                  className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${contact.is_primary ? 'bg-rose-500/10' : 'bg-muted'}`}>
                      <Call size={16} className={contact.is_primary ? 'text-rose-500' : 'text-muted-foreground'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{contact.name}</span>
                        {contact.is_primary && (
                          <Badge className="text-xs bg-rose-500/10 text-rose-500 border-rose-500/20">Primary</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{contact.relationship} • {contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!contact.is_primary && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleSetPrimary(contact.id)}
                      >
                        <TickCircle size={16} />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Night Shift Preference */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Moon size={18} className="text-purple-500" />
            </div>
            <div>
              <Label className="text-foreground font-medium">Night Shift Opt-Out</Label>
              <p className="text-xs text-muted-foreground">Exclude night shift jobs (after 10 PM)</p>
            </div>
          </div>
          <Switch
            checked={profile?.night_shift_opted_out || false}
            onCheckedChange={(checked) => handleUpdateProfile('night_shift_opted_out', checked)}
          />
        </div>

        {/* Working Radius */}
        <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Location size={18} className="text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-medium">Working Radius</Label>
                <span className="text-sm font-semibold text-rose-500">{profile?.working_radius_km || 25} km</span>
              </div>
              <p className="text-xs text-muted-foreground">Maximum distance for job notifications</p>
            </div>
          </div>
          <Slider
            value={[profile?.working_radius_km || 25]}
            min={5}
            max={100}
            step={5}
            onValueCommit={(value) => handleUpdateProfile('working_radius_km', value[0])}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 km</span>
            <span>100 km</span>
          </div>
        </div>

        {/* Backup Pool */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Gps size={18} className="text-blue-500" />
            </div>
            <div>
              <Label className="text-foreground font-medium">Join Backup Pool</Label>
              <p className="text-xs text-muted-foreground">Get notified for urgent last-minute openings</p>
            </div>
          </div>
          <Switch
            checked={profile?.backup_pool_member || false}
            onCheckedChange={(checked) => handleUpdateProfile('backup_pool_member', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetySettings;