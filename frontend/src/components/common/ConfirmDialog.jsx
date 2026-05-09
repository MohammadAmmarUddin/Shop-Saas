import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="">
      <div className="text-center py-4">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
          variant === 'danger' ? 'bg-danger-100 dark:bg-danger-900/30' :
          variant === 'warning' ? 'bg-warning-100 dark:bg-warning-900/30' :
          'bg-primary-100 dark:bg-primary-900/30'
        }`}>
          <FiAlertTriangle className={`text-2xl ${
            variant === 'danger' ? 'text-danger-600' :
            variant === 'warning' ? 'text-warning-600' :
            'text-primary-600'
          }`} />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">{message}</p>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
