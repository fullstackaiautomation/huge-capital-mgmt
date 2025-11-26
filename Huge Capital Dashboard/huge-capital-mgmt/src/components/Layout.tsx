import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Bot, CalendarDays, LogOut, CheckSquare, Users, Building2, Briefcase, Folder, Lightbulb, Key, ClipboardCheck, ChevronRight, Library } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/logo.webp';

export const Layout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isTaskTrackerExpanded, setIsTaskTrackerExpanded] = useState(false);

  const topNavigation = [
    { name: 'Funding Dashboard', href: '/', icon: LayoutDashboard },
    {
      name: 'Task Tracker',
      href: '/tracker',
      icon: CheckSquare,
      hasSubmenu: true,
      submenu: [
        { name: "Dillon's Daily", href: '/tracker/dillon-daily', icon: ClipboardCheck }
      ]
    },
    { name: 'Content Planner', href: '/content', icon: CalendarDays },
    { name: 'Content Library', href: '/library', icon: Library },
    { name: 'Lenders', href: '/lenders', icon: Building2 },
  ];

  const middleNavigation = [
    { name: 'AI Roadmap', href: '/tasks', icon: Bot },
    { name: 'AI Projects', href: '/projects', icon: Folder },
  ];

  const bottomNavigation = [
    { name: 'Logins', href: '/logins', icon: Key },
    { name: 'Bugs & Requests', href: '/bugs', icon: Lightbulb },
  ];

  const comingSoonItems = [
    { name: 'Affiliates', icon: Users },
    { name: 'Deals', icon: Briefcase },
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
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {/* Top Navigation */}
            {topNavigation.map((item) => {
              const Icon = item.icon;
              const isItemActive = isActive(item.href);
              const hasActiveSubmenu = item.submenu?.some(sub => isActive(sub.href));

              return (
                <div key={item.name}>
                  {item.hasSubmenu ? (
                    <>
                      <div className="flex items-center">
                        <Link
                          to={item.href}
                          className={`flex-1 flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                            isItemActive || hasActiveSubmenu
                              ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                              : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </Link>
                        <button
                          onClick={() => setIsTaskTrackerExpanded(!isTaskTrackerExpanded)}
                          className={`p-2 text-gray-400 hover:text-gray-200 transition-all ${
                            isItemActive || hasActiveSubmenu ? 'text-brand-500' : ''
                          }`}
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${
                            isTaskTrackerExpanded ? 'rotate-90' : ''
                          }`} />
                        </button>
                      </div>
                      {isTaskTrackerExpanded && item.submenu && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                  isActive(subItem.href)
                                    ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                                    : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 mr-3" />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                        isItemActive
                          ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                          : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )}
                </div>
              );
            })}

            {/* Spacer */}
            <div className="pt-4 mt-4 border-t border-dark-border"></div>

            {/* Middle Navigation */}
            {middleNavigation.map((item) => {
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

            {/* Coming Soon Section */}
            <div className="pt-8 mt-4 border-t border-dark-border">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Coming Soon
              </h3>
              {comingSoonItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-500 cursor-not-allowed opacity-70"
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Bottom Navigation */}
          <div className="px-4 pb-4">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-gray-400 hover:bg-dark-hover hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>

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
