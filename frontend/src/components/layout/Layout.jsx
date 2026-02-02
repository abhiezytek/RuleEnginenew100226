import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';
import { Toaster } from '../ui/sonner';

export const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="app-layout">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <main 
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
        data-testid="main-content"
      >
        {children}
      </main>
      
      <Toaster position="top-right" richColors />
    </div>
  );
};
