/* SVG 占位图生成器，为项目卡片和文章封面提供渐变底色 */
export function makePlaceholder(key: string): string {
  const dims =
    key === 'p2' || key === 'p3'
      ? [800, 1000]
      : key.charAt(0) === 'e'
        ? [640, 640]
        : [800, 600]
  const palette: Record<string, [string, string]> = {
    p1: ['#1a2433', '#0a0e14'],
    p2: ['#2a2018', '#0d0a07'],
    p3: ['#231a2e', '#0c0810'],
    p4: ['#16242a', '#070d10'],
    j1: ['#1d2533', '#080c12'],
    j2: ['#17242b', '#070d10'],
    j3: ['#221d2c', '#09070e'],
    j4: ['#1f2528', '#080c0f'],
    e1: ['#1a2433', '#080c12'],
    e2: ['#16242a', '#070d10'],
    e3: ['#231a2e', '#0c0810'],
    e4: ['#2a2018', '#0d0a07'],
    e5: ['#1f2a36', '#0a0e14'],
    e6: ['#2a1f28', '#0a0e14'],
  }
  const colors = palette[key] ?? ['#1a2433', '#0a0e14']
  const [w, h] = dims
  let dots = ''
  for (let i = 0; i < 72; i++) {
    const cx = (i * 73 + key.length * 31) % w
    const cy = (i * 157 + key.charCodeAt(0) * 11) % h
    dots += `<circle cx="${cx}" cy="${cy}" r="1" fill="#fff" opacity="0.05"/>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${dots}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
