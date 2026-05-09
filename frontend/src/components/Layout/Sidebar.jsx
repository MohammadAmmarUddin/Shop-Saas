import { NavLink } from 'react-router-dom';
import { FiGrid, FiShoppingCart, FiPackage, FiFolder, FiDollarSign, FiTruck, FiUsers, FiUserPlus, FiBarChart2, FiSettings, FiUsers as FiUsersIcon, FiServer, FiBell, FiChevronLeft, FiChevronRight, FiHome } from 'react-icons/fi';

const navItems = [
  { section: 'Main', items: [
    { to: '/app/dashboard', icon: FiGrid, label: 'Dashboard', exact: true },
    { to: '/app/pos', icon: FiShoppingCart, label: 'POS' },
  ]},
  { section: 'Inventory', items: [
    { to: '/app/products', icon: FiPackage, label: 'Products' },
    { to: '/app/categories', icon: FiFolder, label: 'Categories' },
  ]},
  { section: 'Transactions', items: [
    { to: '/app/sales', icon: FiDollarSign, label: 'Sales' },
    { to: '/app/purchases', icon: FiTruck, label: 'Purchases' },
  ]},
  { section: 'People', items: [
    { to: '/app/customers', icon: FiUsers, label: 'Customers' },
    { to: '/app/suppliers', icon: FiUserPlus, label: 'Suppliers' },
  ]},
  { section: 'Management', items: [
    { to: '/app/expenses', icon: FiBarChart2, label: 'Expenses' },
    { to: '/app/reports', icon: FiBarChart2, label: 'Reports' },
  ]},
  { section: 'System', items: [
    { to: '/app/users', icon: FiUsersIcon, label: 'Users' },
    { to: '/app/backup', icon: FiServer, label: 'Backup' },
    { to: '/app/notifications', icon: FiBell, label: 'Notifications' },
    { to: '/app/settings', icon: FiSettings, label: 'Settings' },
    { to: '/admin/tenants', icon: FiHome, label: 'Admin Panel' },
  ]},
];

const Sidebar = ({ collapsed, onToggle, onMobileClose }) => {
  return (
    <>
      {collapsed && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-secondary-900 dark:bg-[#020617] text-secondary-300 transition-all duration-300 ${
          collapsed ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-white text-lg" />
            </div>
            <span className={`font-bold text-lg text-white ${collapsed ? 'block' : 'lg:hidden'}`}>
              ShopManager
            </span>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-secondary-700 transition-colors hidden lg:block"
          >
            {collapsed ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navItems.map((section) => (
            <div key={section.section}>
              <p className={`px-3 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2 ${collapsed ? 'block' : 'lg:hidden'}`}>
                {section.section}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.exact}
                      onClick={() => onMobileClose && onMobileClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="text-xl flex-shrink-0" />
                      <span className={`${collapsed ? 'block' : 'lg:hidden'} text-sm font-medium`}>
                        {item.label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-secondary-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-secondary-700 rounded-full flex items-center justify-center text-xs font-medium">
              SM
            </div>
            <div className={`${collapsed ? 'block' : 'lg:hidden'}`}>
              <p className="text-sm font-medium text-white">ShopManager</p>
              <p className="text-xs text-secondary-400">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
