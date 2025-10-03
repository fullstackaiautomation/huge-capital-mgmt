import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Bot, FileText, LogOut, CheckSquare } from 'lucide-react';
import logo from '../assets/logo.webp';

export const Layout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Funding Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Task Tracker', href: '/tracker', icon: CheckSquare },
    { name: 'AI Roadmap', href: '/tasks', icon: Bot },
    { name: 'Content Management', href: '/content', icon: FileText },
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
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
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
