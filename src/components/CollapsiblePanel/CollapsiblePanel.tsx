import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import { Button, Card } from '@/components';

interface CollapsiblePanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  style?: React.CSSProperties;
  minimizable?: boolean;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  icon,
  children,
  defaultCollapsed = false,
  className,
  style,
  minimizable = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <Button
        variant="outlined"
        size="large"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-30 bg-white/90 backdrop-blur-sm border-white/20 shadow-lg"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        <Maximize2 className="h-4 w-4 mr-2" />
        {title}
      </Button>
    );
  }

  return (
    <Card className={className} style={style}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          <div className="flex gap-1">
            {minimizable && (
              <Button
                variant="text"
                size="large"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="text"
              size="large"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        {!isCollapsed && <div>{children}</div>}
      </div>
    </Card>
  );
};

export default CollapsiblePanel;