interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizes = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-10 h-10 border-4',
}

export function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`} role="status">
      <div
        className={`${sizes[size]} border-green-600 border-t-transparent rounded-full animate-spin`}
        aria-hidden
      />
      {label && <p className="text-gray-500 text-sm">{label}</p>}
    </div>
  )
}
