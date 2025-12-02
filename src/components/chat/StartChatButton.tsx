import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MessageText } from 'iconsax-react';
import { toast } from '@/hooks/use-toast';

interface StartChatButtonProps {
  receiverId: string;
  receiverName: string;
  jobId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const StartChatButton = ({ 
  receiverId, 
  receiverName, 
  jobId, 
  variant = 'outline',
  size = 'default',
  className 
}: StartChatButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startChat = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to send messages',
        variant: 'destructive'
      });
      return;
    }

    if (user.id === receiverId) {
      toast({
        title: 'Cannot message yourself',
        description: 'You cannot start a conversation with yourself',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_one.eq.${user.id},participant_two.eq.${receiverId}),and(participant_one.eq.${receiverId},participant_two.eq.${user.id})`)
        .eq('job_id', jobId || null)
        .single();

      if (existingConv) {
        navigate('/messages');
        return;
      }

      // Create new conversation
      const { error } = await supabase
        .from('conversations')
        .insert({
          participant_one: user.id,
          participant_two: receiverId,
          job_id: jobId || null
        });

      if (error) throw error;

      toast({
        title: 'Conversation started',
        description: `You can now chat with ${receiverName}`,
      });

      navigate('/messages');
    } catch (error: any) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={startChat}
      disabled={loading}
      className={className}
    >
      <MessageText size={18} className="mr-2" />
      {loading ? 'Starting...' : 'Message'}
    </Button>
  );
};

export default StartChatButton;
