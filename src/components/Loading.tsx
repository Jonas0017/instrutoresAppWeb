import React from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', text = 'Carregando...' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <div className={`animate-spin rounded-full border-4 border-primary-200 border-t-primary-500 ${sizeClasses[size]}`}></div>
        {text && (
          <p className="text-gray-600 font-medium">{text}</p>
        )}
      </div>
    </div>
  )
}

export default Loading 