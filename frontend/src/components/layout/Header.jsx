import React from 'react';
import { Bell, Search, HelpCircle, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const Header = ({ title, subtitle }) => {
  return (
    <header 
      className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between"
      data-testid="header"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            type="search"
            placeholder="Search rules..."
            className="w-64 pl-9 bg-slate-50 border-slate-200"
            data-testid="header-search"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-slate-500" data-testid="header-help">
          <HelpCircle className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-slate-500" data-testid="header-notifications">
          <Bell className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-slate-500" data-testid="header-settings">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
