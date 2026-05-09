import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiMoon, FiSun, FiLogOut, FiSettings, FiChevronDown, FiX } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { notificationService } from '../../services/notificationService';
import { getInitials } from '../../utils/helpers';

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        setUnreadCount(
          res.data?.data?.count
          || res.data?.data?.unread_count
          || res.data?.count
          || res.data?.unread_count
          || 0
        );
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors lg:hidden"
          >
            <FiMenu className="text-xl text-secondary-600 dark:text-secondary-300" />
          </button>

          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search products... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 lg:w-96 pl-10 pr-4 py-2 bg-secondary-100 dark:bg-secondary-700 border border-transparent focus:border-primary-500 rounded-lg text-sm text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
              />
            </form>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/30 md:hidden">
              <div className="w-full max-w-md mx-4">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-xl shadow-lg text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    <FiX size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}

          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors md:hidden"
          >
            <FiSearch className="text-xl text-secondary-600 dark:text-secondary-300" />
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <FiSun className="text-xl text-warning-500" />
            ) : (
              <FiMoon className="text-xl text-secondary-600" />
            )}
          </button>

          <Link
            to="/app/notifications"
            className="relative p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
          >
            <FiBell className="text-xl text-secondary-600 dark:text-secondary-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getInitials(user?.name || user?.email)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-secondary-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <FiChevronDown className="hidden lg:block text-secondary-400" size={16} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 animate-fade-in">
                <div className="px-4 py-3 border-b border-secondary-200 dark:border-secondary-700">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-secondary-500">{user?.email}</p>
                </div>
                <Link
                  to="/app/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <FiSettings size={16} />
                  Settings
                </Link>
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
  );
};

export default Header;
