import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Bot, CalendarDays, LogOut, CheckSquare, Building2, Folder, Lightbulb, Key, ClipboardCheck, TrendingUp } from 'lucide-react';
import logo from '../assets/logo.webp';

export const Layout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Deal Flow section
  const dealFlowNavigation = [
    { name: 'Funding Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Deals', href: '/deals', icon: TrendingUp },
    { name: 'Lenders', href: '/lenders', icon: Building2 },
  ];

  // Team section
  const teamNavigation = [
    { name: 'Task Tracker', href: '/tracker', icon: CheckSquare },
    { name: "Dillon's Daily", href: '/tracker/dillon-daily', icon: ClipboardCheck },
    { name: 'Logins', href: '/logins', icon: Key },
  ];

  // Marketing section
  const marketingNavigation = [
    { name: 'Content Planner', href: '/content', icon: CalendarDays },
  ];

  // Full Stack section
  const fullStackNavigation = [
    { name: 'AI Roadmap', href: '/tasks', icon: Bot },
    { name: 'AI Projects', href: '/projects', icon: Folder },
    { name: 'Bugs & Requests', href: '/bugs', icon: Lightbulb },
  ];


  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-dark-card shadow-2xl border-r border-dark-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 bg-gradient-to-br from-dark-bg to-dark-card border-b border-dark-border">
            <img src={logo} alt="Huge Capital" className="h-12 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {/* Deal Flow Section */}
            <h3 className="px-4 text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Deal Flow
            </h3>
            {dealFlowNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                      : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Team Section */}
            <h3 className="px-4 pt-6 text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Team
            </h3>
            {teamNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                      : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Marketing Section */}
            <h3 className="px-4 pt-6 text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Marketing
            </h3>
            {marketingNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                      : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Full Stack Section */}
            <h3 className="px-4 pt-6 text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Full Stack
            </h3>
            {fullStackNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                      : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-300 truncate max-w-[120px]">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-gray-500 hover:text-brand-500 rounded-lg hover:bg-dark-hover transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
