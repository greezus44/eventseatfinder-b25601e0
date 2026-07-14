export const FONT_OPTIONS = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Calibri',
  'Garamond',
] as const

export type FontOption = typeof FONT_OPTIONS[number]

export function getFontStack(font: string): string {
  const generic: Record<string, string> = {
    Inter: 'Inter, system-ui, sans-serif',
    Arial: 'Arial, Helvetica, sans-serif',
    Helvetica: 'Helvetica, Arial, sans-serif',
    Georgia: 'Georgia, serif',
    'Times New Roman': '"Times New Roman", Times, serif',
    'Courier New': '"Courier New", Courier, monospace',
    Verdana: 'Verdana, Geneva, sans-serif',
    'Trebuchet MS': '"Trebuchet MS", Helvetica, sans-serif',
    Calibri: 'Calibri, "Trebuchet MS", sans-serif',
    Garamond: 'Garamond, Georgia, serif',
  }
  return generic[font] || `'${font}', sans-serif`
}
