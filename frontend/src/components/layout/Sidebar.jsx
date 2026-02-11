import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileCode2, 
  ListChecks, 
  Calculator, 
  Grid3X3, 
  PlayCircle, 
  History, 
  Package,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  TrendingUp,
  Upload
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Rule Builder', href: '/rules/new', icon: FileCode2 },
  { name: 'Rules List', href: '/rules', icon: ListChecks },
  { name: 'Stages', href: '/stages', icon: Layers },
  { name: 'Risk Bands', href: '/risk-bands', icon: TrendingUp },
  { name: 'Scorecards', href: '/scorecards', icon: Calculator },
  { name: 'Grids', href: '/grids', icon: Grid3X3 },
  { name: 'Evaluation', href: '/evaluate', icon: PlayCircle },
  { name: 'Bulk Evaluation', href: '/bulk-evaluate', icon: Upload },
  { name: 'Audit Logs', href: '/audit', icon: History },
  { name: 'Products', href: '/products', icon: Package },
];

export const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200">
        <Shield className="w-8 h-8 text-sky-600 shrink-0" />
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="text-lg font-bold text-slate-900 truncate">PolicyLogic</h1>
            <p className="text-xs text-slate-500">Underwriting Engine</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150",
                isActive 
                  ? "bg-sky-50 text-sky-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-sky-600")} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-4 right-0 translate-x-1/2">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="w-6 h-6 rounded-full bg-white shadow-md border-slate-200"
          data-testid="sidebar-toggle"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </div>
    </aside>
  );
};
