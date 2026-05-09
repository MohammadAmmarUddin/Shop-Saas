const Card = ({ children, className = '', header, footer, hover = false, padding = true }) => {
  return (
    <div
      className={`bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 ${
        hover ? 'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200' : ''
      } ${className}`}
    >
      {header && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
          {typeof header === 'string' ? (
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}
      {children && (
        <div className={padding ? 'p-6' : ''}>{children}</div>
      )}
      {footer && (
        <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
