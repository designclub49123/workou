import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'iconsax-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface JobBookmarkButtonProps {
  jobId: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export const JobBookmarkButton = ({ jobId, variant = 'icon', className }: JobBookmarkButtonProps) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkBookmarkStatus();
    }
  }, [user, jobId]);

  const checkBookmarkStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('job_bookmarks')
        .select('id')
        .eq('user_id', user?.id)
        .eq('job_id', jobId)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to save jobs');
      return;
    }

    try {
      setLoading(true);

      if (isBookmarked) {
        const { error } = await supabase
          .from('job_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId);

        if (error) throw error;
        setIsBookmarked(false);
        toast.success('Job removed from saved');
      } else {
        const { error } = await supabase
          .from('job_bookmarks')
          .insert({ user_id: user.id, job_id: jobId });

        if (error) throw error;
        setIsBookmarked(true);
        toast.success('Job saved!');
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        onClick={toggleBookmark}
        disabled={loading}
        className={className}
      >
        <Heart
          size={18}
          variant={isBookmarked ? 'Bold' : 'Outline'}
          className={cn('mr-2', isBookmarked ? 'text-red-500' : '')}
        />
        {isBookmarked ? 'Saved' : 'Save Job'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleBookmark}
      disabled={loading}
      className={cn('hover:bg-red-500/10', className)}
    >
      <Heart
        size={20}
        variant={isBookmarked ? 'Bold' : 'Outline'}
        className={cn(isBookmarked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500')}
      />
    </Button>
  );
};
