import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ id, label, className, error, ...props }, ref) => {
  const baseClasses = "w-full px-3 py-2.5 border rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-600";
  const errorClasses = "border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500";
  const finalClasses = `${baseClasses} ${error ? errorClasses : 'border-gray-400'}`;

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <input id={id} ref={ref} className={`${finalClasses} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;