import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'blue'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50',
          icon: 'text-green-600',
          border: 'border-green-200'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          icon: 'text-yellow-600',
          border: 'border-yellow-200'
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          icon: 'text-red-600',
          border: 'border-red-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          icon: 'text-purple-600',
          border: 'border-purple-200'
        };
      default:
        return {
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          border: 'border-blue-200'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`bg-white rounded-lg border ${colors.border} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              <svg
                className={`h-4 w-4 ml-1 ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {change.type === 'increase' ? (
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-full ${colors.bg}`}>
            <div className={colors.icon}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard; 