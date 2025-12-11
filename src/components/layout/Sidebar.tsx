import { 
  Home2, 
  BrifecaseTimer, 
  Profile, 
  Setting2, 
  Sun1, 
  Moon, 
  LogoutCurve, 
  SecurityUser, 
  ClipboardText, 
  AddCircle,
  MessageText,
  Notification,
  Heart,
  Calendar,
  Crown,
  Activity,
  Wallet,
  Shield
} from 'iconsax-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { signOut, userRole, user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isOrganizerOrAdmin = userRole === 'organizer' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
      
      // Subscribe to changes
      const channel = supabase
        .channel('sidebar-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchUnreadCounts)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchUnreadCounts)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCounts = async () => {
    if (!user) return;

    // Fetch unread notifications
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    // Fetch unread messages
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    setUnreadNotifications(notifCount || 0);
    setUnreadMessages(msgCount || 0);
  };

  const mainNavItems = [
    { icon: Home2, label: 'Dashboard', path: '/dashboard' },
    { icon: BrifecaseTimer, label: 'Browse Jobs', path: '/jobs' },
    { icon: ClipboardText, label: 'My Applications', path: '/applications' },
    { icon: Heart, label: 'Saved Jobs', path: '/saved-jobs' },
    { icon: MessageText, label: 'Messages', path: '/messages', badge: unreadMessages },
    { icon: Notification, label: 'Notifications', path: '/notifications', badge: unreadNotifications },
  ];

  const organizerNavItems = isOrganizerOrAdmin ? [
    { icon: AddCircle, label: 'Post Job', path: '/post-job' },
    { icon: ClipboardText, label: 'Manage Applications', path: '/manage-applications' },
  ] : [];

  const userNavItems = [
    { icon: Calendar, label: 'My Availability', path: '/availability' },
    { icon: Wallet, label: 'Earnings', path: '/earnings-calculator' },
    { icon: Shield, label: 'Verification', path: '/verification' },
    { icon: Activity, label: 'Activity', path: '/activity' },
    { icon: Profile, label: 'Profile', path: '/profile' },
    { icon: Setting2, label: 'Settings', path: '/settings' },
  ];

  const adminNavItems = isAdmin ? [
    { icon: SecurityUser, label: 'Admin Panel', path: '/admin' },
    { icon: Crown, label: 'Role Requests', path: '/manage-role-requests' },
  ] : [];

  const renderNavItem = ({ icon: Icon, label, path, badge }: { icon: any; label: string; path: string; badge?: number }) => (
    <NavLink
      key={path}
      to={path}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg smooth-transition hover:bg-accent relative"
      activeClassName="bg-accent"
    >
      {({ isActive }) => (
        <>
          <Icon
            size={20}
            variant={isActive ? 'Bold' : 'Outline'}
            className={cn(
              'smooth-transition',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
          <span
            className={cn(
              'font-medium text-sm smooth-transition',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {label}
          </span>
          {badge && badge > 0 && (
            <Badge className="ml-auto gradient-primary text-white text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center">
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
          WorkNexus
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Connect. Work. Grow.</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map(renderNavItem)}
        </div>

        {/* Organizer Section */}
        {organizerNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Organizer
              </p>
            </div>
            <div className="space-y-1">
              {organizerNavItems.map(renderNavItem)}
            </div>
          </>
        )}

        {/* User Section */}
        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </p>
        </div>
        <div className="space-y-1">
          {userNavItems.map(renderNavItem)}
        </div>

        {/* Admin Section */}
        {adminNavItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            </div>
            <div className="space-y-1">
              {adminNavItems.map(renderNavItem)}
            </div>
          </>
        )}

        {/* Become Organizer CTA */}
        {!isOrganizerOrAdmin && (
          <div className="pt-4">
            <NavLink
              to="/become-organizer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 hover:border-rose-500/40 smooth-transition"
            >
              <Crown size={20} className="text-yellow-500" />
              <div>
                <p className="font-medium text-sm">Become an Organizer</p>
                <p className="text-xs text-muted-foreground">Post jobs & hire workers</p>
              </div>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
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
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogoutCurve size={20} variant="Outline" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
