import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { HambergerMenu, Home2, BrifecaseTimer, Profile, Setting2, LogoutCurve, Sun1, Moon } from 'iconsax-react';
import { NavLink } from '@/components/NavLink';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const MobileDrawer = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const navItems = [
    { icon: Home2, label: 'Home', path: '/dashboard' },
    { icon: BrifecaseTimer, label: 'Jobs', path: '/jobs' },
    { icon: Profile, label: 'Profile', path: '/profile' },
    { icon: Setting2, label: 'Settings', path: '/settings' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <HambergerMenu size={24} variant="Outline" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-brand-red via-rose-500 to-brand-orange bg-clip-text text-transparent">
              WorkNexus
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Connect. Work. Grow.</p>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-2 mt-8">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg smooth-transition hover:bg-accent"
              activeClassName="bg-accent"
              onClick={() => setOpen(false)}
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

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
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
          {user && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
            >
              <LogoutCurve size={22} variant="Outline" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileDrawer;
