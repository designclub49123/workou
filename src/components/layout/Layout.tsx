import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';

interface LayoutProps {
  children: ReactNode;
  title: string;
  showTopBar?: boolean;
}

const Layout = ({ children, title, showTopBar = true }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {showTopBar && <TopBar title={title} />}
      <main className="md:ml-64 pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
