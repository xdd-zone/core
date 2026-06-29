'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center w-full overflow-hidden py-20">
      {/* 类似过渡页的背景遮罩，带有微弱警告色的光晕 */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-destructive/5 via-background to-background opacity-50" />

      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-2 items-center">
            <span
              className="w-1.5 h-1.5 rounded-full bg-destructive/40 animate-pulse"
              style={{ animationDelay: '0ms', animationDuration: '1s' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-destructive/60 animate-pulse"
              style={{ animationDelay: '200ms', animationDuration: '1s' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-destructive/80 animate-pulse"
              style={{ animationDelay: '400ms', animationDuration: '1s' }}
            />
          </div>

          <div className="flex flex-col items-center gap-3 text-center px-4">
            <h1 className="text-foreground text-[0.85rem] tracking-[0.25em] font-medium">阵法紊乱，灵气逆流。</h1>
            <p className="text-muted-foreground/60 text-[0.7rem] tracking-[0.15em] max-w-[280px] sm:max-w-md leading-relaxed">
              道法运转似乎出了岔子。若多次破阵失败，请传音给本座 喜东东，定当亲自出手！
            </p>
          </div>
        </div>

        <Button
          onClick={() => reset()}
          variant="outline"
          className="tracking-[0.2em] text-[0.75rem] px-8 h-9 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted"
        >
          破阵重试
        </Button>
      </div>
    </div>
  )
}
