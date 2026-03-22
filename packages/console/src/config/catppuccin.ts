export interface CatppuccinColor {
  name: string
  value: string
}

export interface CatppuccinTheme {
  colors: CatppuccinColor[]
  id: 'latte' | 'frappe' | 'macchiato' | 'mocha'
  name: string
}

export const catppuccinThemes: CatppuccinTheme[] = [
  {
    colors: [
      { name: 'Rosewater', value: '#dc8a78' },
      { name: 'Flamingo', value: '#dd7878' },
      { name: 'Pink', value: '#ea76cb' },
      { name: 'Mauve', value: '#8839ef' },
      { name: 'Red', value: '#d20f39' },
      { name: 'Maroon', value: '#e64553' },
      { name: 'Peach', value: '#fe640b' },
      { name: 'Yellow', value: '#df8e1d' },
      { name: 'Green', value: '#40a02b' },
      { name: 'Teal', value: '#179299' },
      { name: 'Sky', value: '#04a5e5' },
      { name: 'Sapphire', value: '#209fb5' },
      { name: 'Blue', value: '#1e66f5' },
      { name: 'Lavender', value: '#7287fd' },
    ],
    id: 'latte',
    name: 'Latte',
  },
  {
    colors: [
      { name: 'Rosewater', value: '#f2d5cf' },
      { name: 'Flamingo', value: '#eebebe' },
      { name: 'Pink', value: '#f4b8e4' },
      { name: 'Mauve', value: '#ca9ee6' },
      { name: 'Red', value: '#e78284' },
      { name: 'Maroon', value: '#ea999c' },
      { name: 'Peach', value: '#ef9f76' },
      { name: 'Yellow', value: '#e5c890' },
      { name: 'Green', value: '#a6d189' },
      { name: 'Teal', value: '#81c8be' },
      { name: 'Sky', value: '#99d1db' },
      { name: 'Sapphire', value: '#85c1dc' },
      { name: 'Blue', value: '#8caaee' },
      { name: 'Lavender', value: '#babbf1' },
    ],
    id: 'frappe',
    name: 'Frappé',
  },
  {
    colors: [
      { name: 'Rosewater', value: '#f4dbd6' },
      { name: 'Flamingo', value: '#f0c6c6' },
      { name: 'Pink', value: '#f5bde6' },
      { name: 'Mauve', value: '#c6a0f6' },
      { name: 'Red', value: '#ed8796' },
      { name: 'Maroon', value: '#ee99a0' },
      { name: 'Peach', value: '#f5a97f' },
      { name: 'Yellow', value: '#eed49f' },
      { name: 'Green', value: '#a6da95' },
      { name: 'Teal', value: '#8bd5ca' },
      { name: 'Sky', value: '#91d7e3' },
      { name: 'Sapphire', value: '#7dc4e4' },
      { name: 'Blue', value: '#8aadf4' },
      { name: 'Lavender', value: '#b7bdf8' },
    ],
    id: 'macchiato',
    name: 'Macchiato',
  },
  {
    colors: [
      { name: 'Rosewater', value: '#f5e0dc' },
      { name: 'Flamingo', value: '#f2cdcd' },
      { name: 'Pink', value: '#f5c2e7' },
      { name: 'Mauve', value: '#cba6f7' },
      { name: 'Red', value: '#f38ba8' },
      { name: 'Maroon', value: '#eba0ac' },
      { name: 'Peach', value: '#fab387' },
      { name: 'Yellow', value: '#f9e2af' },
      { name: 'Green', value: '#a6e3a1' },
      { name: 'Teal', value: '#94e2d5' },
      { name: 'Sky', value: '#89dceb' },
      { name: 'Sapphire', value: '#74c7ec' },
      { name: 'Blue', value: '#89b4fa' },
      { name: 'Lavender', value: '#b4befe' },
    ],
    id: 'mocha',
    name: 'Mocha',
  },
]

export function getThemeById (id: string): CatppuccinTheme | undefined {
  return catppuccinThemes.find((theme) => theme.id === id)
}

export function getThemeColors (id: string): CatppuccinColor[] | null {
  const theme = getThemeById(id)
  return theme ? theme.colors : null
}
