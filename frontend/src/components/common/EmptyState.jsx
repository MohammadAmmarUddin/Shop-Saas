import { FiInbox } from 'react-icons/fi';
import Button from './Button.jsx';

const EmptyState = ({
  icon: Icon = FiInbox,
  title = 'No data found',
  message = 'There are no items to display.',
  action,
  actionLabel = 'Add New',
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mb-4">
        <Icon className="text-3xl text-secondary-400" />
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center max-w-sm mb-6">{message}</p>
      {action && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
