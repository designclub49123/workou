import { Home2, BrifecaseTimer, Profile, ClipboardText, Notification } from 'iconsax-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const navItems = [
    { icon: Home2, label: 'Home', path: '/dashboard' },
    { icon: BrifecaseTimer, label: 'Jobs', path: '/jobs' },
    { icon: ClipboardText, label: 'Apps', path: '/applications' },
    { icon: Notification, label: 'Alerts', path: '/notifications' },
    { icon: Profile, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 smooth-transition"
            activeClassName="text-foreground"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  variant={isActive ? 'Bold' : 'Outline'}
                  className={cn(
                    'smooth-transition',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium smooth-transition',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
