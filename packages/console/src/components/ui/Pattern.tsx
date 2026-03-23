interface PatternProps {
  /**
   * 动画持续时间（秒）
   */
  animationDuration?: number
}

export function Pattern({ animationDuration = 4 }: PatternProps) {
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
          background: linear-gradient(
            135deg,
            var(--ctp-base) 25%,
            var(--ctp-mantle) 25%,
            var(--ctp-mantle) 50%,
            var(--ctp-base) 50%,
            var(--ctp-base) 75%,
            var(--ctp-mantle) 75%,
            var(--ctp-mantle)
          );
          background-size: 40px 40px;
          opacity: 0.96;
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
      <div className="pattern-container" />
    </>
  )
}
