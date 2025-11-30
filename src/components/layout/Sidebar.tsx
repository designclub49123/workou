import { Home2, BrifecaseTimer, Profile, Setting2, Sun1, Moon, LogoutCurve } from 'iconsax-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { icon: Home2, label: 'Home', path: '/' },
    { icon: BrifecaseTimer, label: 'Jobs', path: '/jobs' },
    { icon: Profile, label: 'Profile', path: '/profile' },
    { icon: Setting2, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-brand-red via-rose-500 to-brand-orange bg-clip-text text-transparent">
          WorkNexus
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Connect. Work. Grow.</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg smooth-transition hover:bg-accent"
            activeClassName="bg-accent"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  variant={isActive ? 'Bold' : 'Outline'}
                  className={cn(
                    'smooth-transition',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'font-medium smooth-transition',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={toggleTheme}
        >
          {theme === 'light' ? (
            <>
              <Moon size={22} variant="Outline" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun1 size={22} variant="Outline" />
              <span>Light Mode</span>
            </>
          )}
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
          <LogoutCurve size={22} variant="Outline" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
