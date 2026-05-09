const colorMap = {
  success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
  danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
};

const Badge = ({ children, color = 'secondary', className = '', dot = false, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${colorMap[color] || colorMap.secondary} ${sizeClasses} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          color === 'success' ? 'bg-success-500' :
          color === 'warning' ? 'bg-warning-500' :
          color === 'danger' ? 'bg-danger-500' :
          color === 'info' ? 'bg-blue-500' :
          'bg-secondary-500'
        }`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
