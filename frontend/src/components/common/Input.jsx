import { FiAlertCircle } from 'react-icons/fi';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  options = [],
  rows = 3,
  ...props
}) => {
  const baseClasses = `w-full px-3 py-2 border rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
    error
      ? 'border-danger-500 focus:ring-danger-500'
      : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${Icon ? 'pl-10' : ''}`;

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={baseClasses}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={baseClasses}
          {...props}
        />
      );
    }

    return (
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={baseClasses}
        {...props}
      />
    );
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="text-secondary-400" size={18} />
          </div>
        )}
        {renderInput()}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-500 flex items-center gap-1">
          <FiAlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
