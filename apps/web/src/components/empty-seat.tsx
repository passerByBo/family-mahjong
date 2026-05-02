'use client'

interface EmptySeatProps {
  position: 'bottom' | 'right' | 'top' | 'left'
  onAdd: () => void
}

const positionStyles: Record<string, string> = {
  bottom: 'flex-col items-center',
  top: 'flex-col items-center',
  left: 'flex-row items-center',
  right: 'flex-row-reverse items-center',
}

export function EmptySeat({ position, onAdd }: EmptySeatProps) {
  return (
    <div className={`flex gap-1.5 ${positionStyles[position]}`}>
      <button
        onClick={onAdd}
        className="h-12 w-12 rounded-full border-dashed border-2 border-white/40 flex items-center justify-center cursor-pointer hover:border-white/70 hover:bg-white/10 transition-colors"
      >
        <span className="text-white/60 text-xl leading-none">+</span>
      </button>
      <span className="text-white/60 text-sm">空位</span>
    </div>
  )
}
