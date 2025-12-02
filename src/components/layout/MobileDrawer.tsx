import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  HambergerMenu, Home2, BrifecaseTimer, Profile, Setting2, LogoutCurve, 
  Sun1, Moon, ClipboardText, AddCircle, SecurityUser, Heart, MessageText,
  Notification, Calendar, Activity, People, UserAdd
} from 'iconsax-react';
import { NavLink } from '@/components/NavLink';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const MobileDrawer = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, userRole } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isOrganizerOrAdmin = userRole === 'organizer' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
    }
  }, [user]);

  const fetchUnreadCounts = async () => {
    if (!user) return;

    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadMessages(msgCount || 0);
    setUnreadNotifications(notifCount || 0);
  };

  const mainNavItems = [
    { icon: Home2, label: 'Dashboard', path: '/dashboard' },
    { icon: BrifecaseTimer, label: 'Browse Jobs', path: '/jobs' },
    { icon: ClipboardText, label: 'My Applications', path: '/applications' },
    { icon: Heart, label: 'Saved Jobs', path: '/saved-jobs' },
    { icon: MessageText, label: 'Messages', path: '/messages', badge: unreadMessages },
    { icon: Notification, label: 'Notifications', path: '/notifications', badge: unreadNotifications },
  ];

  const organizerNavItems = [
    { icon: AddCircle, label: 'Post Job', path: '/post-job' },
    { icon: People, label: 'Manage Applications', path: '/manage-applications' },
  ];

  const workerNavItems = [
    { icon: Calendar, label: 'My Availability', path: '/worker-availability' },
    { icon: Activity, label: 'Activity Feed', path: '/activity-feed' },
  ];

  const accountNavItems = [
    { icon: Profile, label: 'Profile', path: '/profile' },
    { icon: Setting2, label: 'Settings', path: '/settings' },
    { icon: UserAdd, label: 'Become Organizer', path: '/become-organizer' },
  ];

  const adminNavItems = [
    { icon: SecurityUser, label: 'Admin Dashboard', path: '/admin' },
    { icon: People, label: 'Role Requests', path: '/manage-role-requests' },
  ];

  const renderNavSection = (items: typeof mainNavItems, title?: string) => (
    <>
      {title && (
        <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 mt-1">
          {title}
        </p>
      )}
      {items.map(({ icon: Icon, label, path, badge }) => (
        <NavLink
          key={path}
          to={path}
          className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-accent mx-2"
          activeClassName="bg-gradient-to-r from-rose-500/10 to-orange-500/10"
          onClick={() => setOpen(false)}
        >
          {({ isActive }) => (
            <>
              <Icon
                size={24}
                variant={isActive ? 'Bold' : 'Outline'}
                className={cn(
                  'transition-colors flex-shrink-0',
                  isActive ? 'text-rose-500' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'flex-1 text-base font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
              {badge ? (
                <Badge className="h-6 min-w-6 px-2 text-xs bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0">
                  {badge}
                </Badge>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <HambergerMenu size={24} variant="Outline" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-left">
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              WorkNexus
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Connect. Work. Grow.</p>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-1 px-2">
            {renderNavSection(mainNavItems)}
            
            <Separator className="my-3" />
            
            {isOrganizerOrAdmin && (
              <>
                {renderNavSection(organizerNavItems, 'Organizer')}
                <Separator className="my-3" />
              </>
            )}
            
            {renderNavSection(workerNavItems, 'Worker')}
            
            <Separator className="my-3" />
            
            {renderNavSection(accountNavItems, 'Account')}
            
            {isAdmin && (
              <>
                <Separator className="my-3" />
                {renderNavSection(adminNavItems, 'Admin')}
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <>
                <Moon size={20} variant="Outline" />
                <span className="text-sm">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun1 size={20} variant="Outline" />
                <span className="text-sm">Light Mode</span>
              </>
            )}
          </Button>
          {user && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
            >
              <LogoutCurve size={20} variant="Outline" />
              <span className="text-sm">Logout</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileDrawer;
