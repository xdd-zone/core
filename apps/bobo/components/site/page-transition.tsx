'use client'

import { useEffect, useState } from 'react'

import { THINKING_WORDS } from './thinking-words'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [word, setWord] = useState(THINKING_WORDS[0])
  const [isTransitioning, setIsTransitioning] = useState(true)

  useEffect(() => {
    // 每次组件挂载时（即进入新页面时），选一个随机词。为了避免 hydration 报错，必须在这里设置。
    // eslint-disable-next-line react/set-state-in-effect
    setWord(THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)])

    // 短暂延迟后移除过渡效果
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative flex-1 flex flex-col w-full h-full">
      {/* 遮罩层 - 页面切换时的中间态 */}
      <div
        className={`absolute inset-0 z-[40] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isTransitioning
            ? 'opacity-100 pointer-events-auto backdrop-blur-md'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`sticky top-0 w-full h-[100dvh] flex flex-col items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isTransitioning ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-8'
          }`}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-2 items-center">
              <span
                className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-pulse"
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-pulse"
                style={{ animationDelay: '200ms', animationDuration: '1s' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-foreground/80 animate-pulse"
                style={{ animationDelay: '400ms', animationDuration: '1s' }}
              />
            </div>
            <div className="overflow-hidden flex flex-col items-center gap-2">
              <p
                className={`text-foreground text-[0.85rem] tracking-[0.25em] font-medium transition-transform duration-500 ease-out ${
                  isTransitioning ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              >
                {word.zh}
              </p>
              <p
                className={`text-muted-foreground/60 text-[0.65rem] tracking-[0.35em] uppercase italic transition-transform duration-500 delay-75 ease-out ${
                  isTransitioning ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              >
                {word.en}...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 页面内容 */}
      <div
        className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] flex-1 flex flex-col ${
          isTransitioning
            ? 'opacity-0 translate-y-12 blur-[8px] scale-[0.98]'
            : 'opacity-100 translate-y-0 blur-none scale-100'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
