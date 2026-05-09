import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatsCard = ({ icon: Icon, label, value, trend, trendLabel, color = 'primary', currency = false }) => {
  const colorStyles = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
    warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (currency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatValue(value)}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              isPositive ? 'text-success-600' :
              isNeutral ? 'text-secondary-500' :
              'text-danger-600'
            }`}>
              {isPositive ? <FiTrendingUp size={16} /> : isNeutral ? null : <FiTrendingDown size={16} />}
              <span className="font-medium">{isPositive ? '+' : ''}{trend}%</span>
              {trendLabel && <span className="text-secondary-400 ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorStyles[color] || colorStyles.primary}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
