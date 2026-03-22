import { useSettingStore } from '@/stores'

interface PatternProps {
  /**
   * 动画持续时间（秒）
   */
  animationDuration?: number
}

export function Pattern ({ animationDuration = 4 }: PatternProps) {
  const { isDark } = useSettingStore()

  const patternClass = isDark ? 'pattern-dark' : 'pattern-light'

  return (
    <>
      <style>{`
        .pattern-container {
          /* Basic dimensions */
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          
          /* Animation */
          animation: move ${animationDuration}s linear infinite;
        }

        /* Auto theme - follows current dark mode state */
        .pattern-auto {
          /* This class is no longer used, replaced by dynamic class assignment */
        }

        /* Forced light theme */
        .pattern-light {
          background: #f8f9fa;
          background: linear-gradient(
            135deg,
            #f8f9fa 25%,
            #e9ecef 25%,
            #e9ecef 50%,
            #f8f9fa 50%,
            #f8f9fa 75%,
            #e9ecef 75%,
            #e9ecef
          );
          background-size: 40px 40px;
        }

        /* Forced dark theme */
        .pattern-dark {
          background: #121212;
          background: linear-gradient(
            135deg,
            #121212 25%,
            #1a1a1a 25%,
            #1a1a1a 50%,
            #121212 50%,
            #121212 75%,
            #1a1a1a 75%,
            #1a1a1a
          );
          background-size: 40px 40px;
        }

        @keyframes move {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 40px 40px;
          }
        }
      `}</style>
      <div className={`pattern-container ${patternClass}`} />
    </>
  )
}
