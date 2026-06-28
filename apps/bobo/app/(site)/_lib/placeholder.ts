/* SVG 占位图生成器，为项目卡片和文章封面提供渐变底色，适配系统明暗模式与 Catppuccin 主题色 */
export function makePlaceholder(key: string): string {
  const dims = key === 'p2' || key === 'p3' ? [800, 1000] : key.charAt(0) === 'e' ? [640, 640] : [800, 600]
  
  // 各分类使用的 Catppuccin Accent 色相 (光/暗)
  const accents: Record<string, { light: string; dark: string }> = {
    p1: { light: '#1e66f5', dark: '#89b4fa' }, // Blue
    p2: { light: '#fe640b', dark: '#fab387' }, // Peach
    p3: { light: '#8839ef', dark: '#cba6f7' }, // Mauve
    p4: { light: '#179299', dark: '#94e2d5' }, // Teal
    j1: { light: '#d20f39', dark: '#f38ba8' }, // Red
    j2: { light: '#40a02b', dark: '#a6e3a1' }, // Green
    j3: { light: '#04a5e5', dark: '#89dceb' }, // Sky
    j4: { light: '#df8e1d', dark: '#f9e2af' }, // Yellow
    e1: { light: '#ea76cb', dark: '#f5c2e7' }, // Pink
    e2: { light: '#1e66f5', dark: '#89b4fa' }, // Blue
    e3: { light: '#8839ef', dark: '#cba6f7' }, // Mauve
    e4: { light: '#fe640b', dark: '#fab387' }, // Peach
    e5: { light: '#179299', dark: '#94e2d5' }, // Teal
    e6: { light: '#40a02b', dark: '#a6e3a1' }, // Green
  }
  const accent = accents[key] ?? { light: '#1e66f5', dark: '#89b4fa' }
  const [w, h] = dims

  let dots = ''
  for (let i = 0; i < 72; i++) {
    const cx = (i * 73 + key.length * 31) % w
    const cy = (i * 157 + key.charCodeAt(0) * 11) % h
    dots += `<circle cx="${cx}" cy="${cy}" r="1" fill="var(--dot)"/>`
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>
  :root {
    --bg-base: #eff1f5;
    --bg-crust: #dce0e8;
    --accent: ${accent.light};
    --start: color-mix(in srgb, var(--accent) 12%, var(--bg-base));
    --end: color-mix(in srgb, var(--accent) 18%, var(--bg-crust));
    --dot: rgba(0, 0, 0, 0.05);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-base: #1e1e2e;
      --bg-crust: #11111b;
      --accent: ${accent.dark};
      --start: color-mix(in srgb, var(--accent) 18%, var(--bg-base));
      --end: color-mix(in srgb, var(--accent) 26%, var(--bg-crust));
      --dot: rgba(255, 255, 255, 0.04);
    }
  }
</style>
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="var(--start)"/>
    <stop offset="1" stop-color="var(--end)"/>
  </linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
${dots}
</svg>`

  const minifiedSvg = svg.replace(/\n\s*/g, '')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(minifiedSvg)}`
}
