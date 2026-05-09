const LoadingSpinner = ({ size = 'md', text = 'Loading...', fullPage = false }) => {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} border-4 border-secondary-200 dark:border-secondary-600 border-t-primary-600 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-secondary-500 dark:text-secondary-400">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-secondary-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
