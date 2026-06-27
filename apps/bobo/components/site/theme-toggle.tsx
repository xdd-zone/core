'use client'

import type { ThemeSetting } from '@/lib/theme'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options: { label: string; value: ThemeSetting }[] = [
    { label: 'Light', value: 'latte' },
    { label: 'System', value: 'system' },
    { label: 'Dark', value: 'macchiato' },
  ]

  return (
    <div className="inline-flex items-center gap-1.5 text-muted-foreground text-[0.85rem]">
      {options.map((option, index) => (
        <span key={option.value} className="inline-flex items-center gap-1.5">
          <button
            onClick={() => setTheme(option.value)}
            className={`transition-all duration-200 hover:text-foreground hover:underline hover:decoration-1 hover:underline-offset-[3px] ${
              theme === option.value ? 'text-foreground underline decoration-1 underline-offset-[3px]' : ''
            }`}
            type="button"
          >
            {option.label}
          </button>
          {index < options.length - 1 && <span className="text-muted-foreground opacity-50 mx-0.5">·</span>}
        </span>
      ))}
    </div>
  )
}
