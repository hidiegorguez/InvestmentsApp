import React from 'react';

type IconButtonVariant = 'default' | 'success' | 'danger' | 'warning';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: IconButtonVariant;
  size?: 'sm' | 'md';
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'text-gray-400 hover:text-gray-600',
  success: 'text-emerald-600 hover:text-emerald-700',
  danger: 'text-gray-400 hover:text-gray-700',
  warning: 'text-gray-400 hover:text-orange-500',
};

const sizeClasses = {
  sm: 'p-1 text-base',
  md: 'p-1.5 text-lg',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`
        rounded transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <i className={`fi ${icon}`}></i>
    </button>
  );
};

export default IconButton;
