import { Notification, Sun1, Moon } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import MobileDrawer from './MobileDrawer';

interface TopBarProps {
  title: string;
  showNotification?: boolean;
}

const TopBar = ({ title, showNotification = true }: TopBarProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border md:hidden">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <MobileDrawer />
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'light' ? (
              <Moon size={20} variant="Outline" />
            ) : (
              <Sun1 size={20} variant="Outline" />
            )}
          </Button>
          {showNotification && (
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Notification size={20} variant="Outline" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-red rounded-full" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
