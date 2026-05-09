import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiCreditCard, FiBarChart2, FiSettings, FiSun, FiMoon, FiBell, FiUser, FiLogOut, FiMenu, FiChevronDown, FiHome, FiShield } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { getInitials } from '../../utils/helpers';

const adminNavItems = [
  { to: '/admin/tenants', icon: FiUsers, label: 'Tenants' },
  { to: '/admin/plans', icon: FiCreditCard, label: 'Plans' },
  { to: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
  { to: '/admin/settings', icon: FiSettings, label: 'System Settings' },
];

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-secondary-50 dark:bg-secondary-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-secondary-900 dark:bg-[#020617] text-secondary-300 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 h-16 px-4 border-b border-secondary-700">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FiShield className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white">Admin Panel</span>
            <p className="text-xs text-secondary-400">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavLink
            to="/app/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-400 hover:bg-secondary-800 hover:text-white transition-colors mb-4"
          >
            <FiHome className="text-xl" />
            <span className="text-sm font-medium">Back to App</span>
          </NavLink>

          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                }`
              }
            >
              <item.icon className="text-xl" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-secondary-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-secondary-700 rounded-full flex items-center justify-center text-xs font-medium">
              SA
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin Panel</p>
              <p className="text-xs text-secondary-400">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors lg:hidden"
            >
              <FiMenu className="text-xl text-secondary-600 dark:text-secondary-300" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              >
                {darkMode ? <FiSun className="text-warning-500" /> : <FiMoon className="text-secondary-600" />}
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(user?.name || user?.email)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-secondary-500">Super Admin</p>
                  </div>
                  <FiChevronDown className="hidden lg:block text-secondary-400" size={16} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 animate-fade-in">
                    <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-secondary-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 w-full transition-colors"
                    >
                      <FiLogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
