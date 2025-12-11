import { Home2, BrifecaseTimer, MessageText, Profile } from 'iconsax-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const navItems = [
    { icon: Home2, label: 'Home', path: '/dashboard' },
    { icon: BrifecaseTimer, label: 'Jobs', path: '/jobs' },
    { icon: MessageText, label: 'Messages', path: '/messages' },
    { icon: Profile, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-4 pb-safe">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  isActive && 'bg-gradient-to-r from-rose-500 to-orange-500'
                )}>
                  <Icon
                    size={22}
                    variant={isActive ? 'Bold' : 'Outline'}
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-white' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[11px] font-semibold transition-colors duration-200',
                    isActive 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500' 
                      : 'text-muted-foreground'
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
