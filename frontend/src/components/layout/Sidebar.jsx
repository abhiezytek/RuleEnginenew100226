import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Upload,
  Users,
  FileText,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

const getNavigation = (hasPermission) => {
  const nav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Rule Templates', href: '/templates', icon: FileText },
    { name: 'Rule Builder', href: '/rules/new', icon: FileCode2, permission: 'can_create_rules' },
    { name: 'Rules List', href: '/rules', icon: ListChecks },
    { name: 'Stages', href: '/stages', icon: Layers },
    { name: 'Risk Bands', href: '/risk-bands', icon: TrendingUp },
    { name: 'Scorecards', href: '/scorecards', icon: Calculator },
    { name: 'Grids', href: '/grids', icon: Grid3X3 },
    { name: 'Evaluation', href: '/evaluate', icon: PlayCircle },
    { name: 'Bulk Evaluation', href: '/bulk-evaluate', icon: Upload },
    { name: 'Audit Logs', href: '/audit', icon: History, permission: 'can_view_audit' },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Users', href: '/users', icon: Users, permission: 'can_manage_users' },
  ];
  
  return nav.filter(item => !item.permission || hasPermission(item.permission));
};

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  viewer: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const navigation = getNavigation(hasPermission);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
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

      {/* User Profile Section */}
      {user && (
        <div className="p-3 border-t border-slate-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150",
                "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}>
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-sky-600" />
                </div>
                {!collapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <Badge className={cn("text-xs mt-0.5", ROLE_COLORS[user.role])}>
                      {user.role}
                    </Badge>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-slate-500">@{user.username}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="absolute bottom-20 right-0 translate-x-1/2">
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
