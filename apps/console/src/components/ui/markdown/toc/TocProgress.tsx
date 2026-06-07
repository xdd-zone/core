import type { FC, ReactElement } from 'react'

export interface TocProgressProps {
  progress: number
}

export const TocProgress: FC<TocProgressProps> = ({ progress }): ReactElement => {
  const clamped = Math.min(Math.max(progress, 0), 100)
  const radius = 8
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 100)
  return (
    <div className="text-fg-muted/70 flex items-center gap-2">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r={radius} fill="none" stroke="var(--primary-color)" strokeWidth="3" opacity="0.25" />
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="var(--primary-color)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 10 10)"
        />
      </svg>
      <span className="text-fg-muted/80 text-sm font-medium">{clamped}%</span>
    </div>
  )
}
