import React, { useState } from 'react';
import { Menu, X, MapPin, Layers, Settings, Info } from 'lucide-react';
import { Button } from '@/components/Button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveNavProps {
  children: React.ReactNode;
}

const ResponsiveNav: React.FC<ResponsiveNavProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="outlined"
        size="large"
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm border-white/20 shadow-lg"
      >
        {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={toggleMenu} />
      )}

      {/* Mobile Menu Content */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md border-r border-white/20 shadow-2xl transform transition-transform duration-300 z-40 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 pt-16 space-y-4 h-full overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <Layers className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-lg">Weather Map</h2>
          </div>
          {children}
        </div>
      </div>
    </>
  );
};

export default ResponsiveNav;
