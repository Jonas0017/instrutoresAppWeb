import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick, 
  hover = false 
}) => {
  return (
    <div
      className={`
        card p-6
        ${hover ? 'hover:shadow-xl transition-shadow cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card 