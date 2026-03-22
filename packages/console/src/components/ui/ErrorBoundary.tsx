import { useRouteError } from 'react-router'

import { Pattern } from './Pattern'

/**
 * 错误边界组件，用于捕获并处理子组件抛出的错误。
 */
export function ErrorBoundary() {
  const error = useRouteError()

  // 处理其他类型的错误
  const errorMessage = error instanceof Error ? error.message : '发生未知错误'

  return (
    <>
      <Pattern />
      <style>{`
        .glitch {
          position: relative;
          font-size: 8rem; /* 调整字体大小 */
          font-weight: 700;
          line-height: 1;
          color: #fff;
          letter-spacing: -0.025em;
          text-shadow:
            0 0 2px rgba(255, 0, 0, 0.5),
            0 0 5px rgba(0, 255, 0, 0.5),
            0 0 10px rgba(0, 0, 255, 0.5);
        }

        .glitch::before,
        .glitch::after {
          content: '500';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent; /* 背景透明 */
          overflow: hidden;
        }

        .glitch::before {
          left: 2px;
          text-shadow: -2px 0 #ff00c1;
          animation: glitch-before 3s infinite linear alternate-reverse;
        }

        .glitch::after {
          left: -2px;
          text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
          animation: glitch-after 2s infinite linear alternate-reverse;
        }

        @keyframes glitch-before {
          0% { clip-path: inset(85% 0 8% 0); }
          10% { clip-path: inset(54% 0 7% 0); }
          20% { clip-path: inset(49% 0 43% 0); }
          30% { clip-path: inset(75% 0 18% 0); }
          40% { clip-path: inset(40% 0 41% 0); }
          50% { clip-path: inset(2% 0 82% 0); }
          60% { clip-path: inset(76% 0 23% 0); }
          70% { clip-path: inset(27% 0 49% 0); }
          80% { clip-path: inset(23% 0 19% 0); }
          90% { clip-path: inset(88% 0 3% 0); }
          100% { clip-path: inset(3% 0 94% 0); }
        }

        @keyframes glitch-after {
          0% { clip-path: inset(82% 0 10% 0); }
          10% { clip-path: inset(5% 0 89% 0); }
          20% { clip-path: inset(43% 0 32% 0); }
          30% { clip-path: inset(30% 0 6% 0); }
          40% { clip-path: inset(89% 0 8% 0); }
          50% { clip-path: inset(45% 0 47% 0); }
          60% { clip-path: inset(63% 0 3% 0); }
          70% { clip-path: inset(13% 0 64% 0); }
          80% { clip-path: inset(60% 0 33% 0); }
          90% { clip-path: inset(73% 0 2% 0); }
          100% { clip-path: inset(1% 0 95% 0); }
        }

        @keyframes shimmer {
          from {
            background-position: 0 0;
          }
          to {
            background-position: -200% 0;
          }
        }

        .shimmer-button {
          animation: shimmer 2s linear infinite;
          background: linear-gradient(to right, #4f46e5 0%, #c026d3 50%, #4f46e5 100%);
          background-size: 200% 100%;
        }
      `}</style>
      <div className="relative flex h-screen w-full flex-col items-center justify-center">
        <div className="glitch">500</div>
        <h1 className="text-fg mt-4 text-3xl font-bold">应用发生错误</h1>
        <p className="text-fg-muted mt-2 text-center">{errorMessage}</p>
        <button
          type="button"
          onClick={() => (window.location.href = '/')}
          className="shimmer-button mt-6 rounded-md px-6 py-3 font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
        >
          返回首页
        </button>
      </div>
    </>
  )
}
