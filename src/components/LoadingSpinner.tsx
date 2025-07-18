import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-8 w-8';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'white':
        return 'text-white';
      case 'gray':
        return 'text-gray-500';
      default:
        return 'text-blue-600';
    }
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${getSizeClasses()} ${getColorClasses()}`} />
      {text && (
        <p className={`mt-2 text-sm ${color === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 