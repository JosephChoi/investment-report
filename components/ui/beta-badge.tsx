interface BetaBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BetaBadge({ className = '', size = 'md' }: BetaBadgeProps) {
  console.log('BetaBadge 렌더링됨 - size:', size, 'className:', className);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span 
      className={`
        inline-flex items-center 
        ${sizeClasses[size]} 
        bg-blue-500 text-white
        border-2 border-blue-600 
        rounded-full font-bold 
        shadow-lg
        z-50
        ${className}
      `}
      style={{ 
        minWidth: 'fit-content',
        display: 'inline-flex',
        visibility: 'visible'
      }}
    >
      <span className="relative flex h-2 w-2 mr-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-200"></span>
      </span>
      BETA
    </span>
  );
} 