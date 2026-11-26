// Turns a theme (stored in the database) into CSS variables for the public site.
// Keep the font lists in step with Backend/app/schemas/theme.py.

// family: CSS font stack    google: Google Fonts spec (null = already loaded in index.html)
// weight / tracking: how headings are set in this font
export const HEADING_FONTS = {
  newsreader: { label: 'Newsreader (serif)', family: "'Newsreader', Georgia, serif", google: null, weight: 400, tracking: '-0.015em' },
  playfair: { label: 'Playfair Display (serif)', family: "'Playfair Display', Georgia, serif", google: 'Playfair+Display:wght@400;500;600', weight: 500, tracking: '-0.01em' },
  fraunces: { label: 'Fraunces (soft serif)', family: "'Fraunces', Georgia, serif", google: 'Fraunces:opsz,wght@9..144,400;9..144,500', weight: 400, tracking: '-0.02em' },
  'dm-serif': { label: 'DM Serif Display (serif)', family: "'DM Serif Display', Georgia, serif", google: 'DM+Serif+Display', weight: 400, tracking: '-0.005em' },
  cormorant: { label: 'Cormorant Garamond (elegant serif)', family: "'Cormorant Garamond', Georgia, serif", google: 'Cormorant+Garamond:wght@500;600', weight: 500, tracking: '-0.01em' },
  poppins: { label: 'Poppins (friendly)', family: "'Poppins', system-ui, sans-serif", google: 'Poppins:wght@400;500;600', weight: 600, tracking: '-0.03em' },
  outfit: { label: 'Outfit (rounded modern)', family: "'Outfit', system-ui, sans-serif", google: 'Outfit:wght@400;500;600', weight: 600, tracking: '-0.025em' },
  syne: { label: 'Syne (expressive)', family: "'Syne', system-ui, sans-serif", google: 'Syne:wght@500;600;700', weight: 700, tracking: '-0.03em' },
  bebas: { label: 'Bebas Neue (tall capitals)', family: "'Bebas Neue', Impact, sans-serif", google: 'Bebas+Neue', weight: 400, tracking: '0.01em' },
  'space-grotesk': { label: 'Space Grotesk (modern)', family: "'Space Grotesk', system-ui, sans-serif", google: 'Space+Grotesk:wght@400;500;600', weight: 500, tracking: '-0.035em' },
  sora: { label: 'Sora (geometric)', family: "'Sora', system-ui, sans-serif", google: 'Sora:wght@400;500;600', weight: 600, tracking: '-0.035em' },
  manrope: { label: 'Manrope (clean)', family: "'Manrope', system-ui, sans-serif", google: 'Manrope:wght@400;500;600;700', weight: 700, tracking: '-0.03em' },
  inter: { label: 'Inter (neutral)', family: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400;500;600', weight: 600, tracking: '-0.03em' },
}

export const BODY_FONTS = {
  'dm-sans': { label: 'DM Sans', family: "'DM Sans', system-ui, sans-serif", google: null },
  inter: { label: 'Inter', family: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400;500;600' },
  manrope: { label: 'Manrope', family: "'Manrope', system-ui, sans-serif", google: 'Manrope:wght@400;500;600;700' },
  'work-sans': { label: 'Work Sans', family: "'Work Sans', system-ui, sans-serif", google: 'Work+Sans:wght@400;500;600' },
  'space-grotesk': { label: 'Space Grotesk', family: "'Space Grotesk', system-ui, sans-serif", google: 'Space+Grotesk:wght@400;500;600' },
  poppins: { label: 'Poppins', family: "'Poppins', system-ui, sans-serif", google: 'Poppins:wght@400;500;600' },
  outfit: { label: 'Outfit', family: "'Outfit', system-ui, sans-serif", google: 'Outfit:wght@400;500;600' },
  'nunito-sans': { label: 'Nunito Sans', family: "'Nunito Sans', system-ui, sans-serif", google: 'Nunito+Sans:wght@400;600' },
  'source-sans': { label: 'Source Sans', family: "'Source Sans 3', system-ui, sans-serif", google: 'Source+Sans+3:wght@400;600' },
}

// Every font by key, for the style of a single text (Visual editor).
export const FONTS = { ...BODY_FONTS, ...HEADING_FONTS }

// One-click heading + text combinations for the Fonts page.
export const FONT_PAIRINGS = [
  { name: 'Editorial', heading_font: 'newsreader', body_font: 'dm-sans' },
  { name: 'Classic serif', heading_font: 'playfair', body_font: 'source-sans' },
  { name: 'Elegant', heading_font: 'cormorant', body_font: 'nunito-sans' },
  { name: 'Warm', heading_font: 'fraunces', body_font: 'work-sans' },
  { name: 'Modern', heading_font: 'space-grotesk', body_font: 'inter' },
  { name: 'Friendly', heading_font: 'poppins', body_font: 'poppins' },
  { name: 'Geometric', heading_font: 'sora', body_font: 'outfit' },
  { name: 'Expressive', heading_font: 'syne', body_font: 'manrope' },
  { name: 'Poster', heading_font: 'bebas', body_font: 'inter' },
]

// A site's own choices on top of its theme. An empty font means "use the theme's".
export const BLANK_TYPOGRAPHY = {
  heading_font: null,
  body_font: null,
  logo_font: null,
  heading_scale: 'normal',
  heading_case: 'normal',
  text_scale: 'normal',
}

export const HEADING_SCALES = { compact: ['Compact', 0.860], normal: ['Normal', 1], large: ['Large', 1.160] }
export const TEXT_SCALES = { small: ['Small', '93.75%'], normal: ['Normal', '100%'], large: ['Large', '107%'] }

// The theme's tokens with the site's own font choices applied.
export function withTypography(tokens, typography) {
  if (!tokens || !typography) return tokens
  return {
    ...tokens,
    heading_font: typography.heading_font || tokens.heading_font,
    body_font: typography.body_font || tokens.body_font,
    logo_font: typography.logo_font || tokens.logo_font,
  }
}

export const LOGO_FONTS = { script: 'Handwritten script', heading: 'Same as headings' }

export const SHAPES = {
  rounded: { label: 'Rounded (pill buttons)', radius: '16px', small: '10px', large: '26px', pill: '999px' },
  soft: { label: 'Soft corners', radius: '10px', small: '8px', large: '14px', pill: '10px' },
  sharp: { label: 'Sharp (square)', radius: '0px', small: '0px', large: '0px', pill: '0px' },
}

export const COLOR_FIELDS = [
  ['bg', 'Page background'],
  ['surface', 'Cards and inputs'],
  ['text', 'Text'],
  ['accent', 'Accent (buttons, links)'],
  ['on_accent', 'Text on accent'],
  ['tint', 'Soft section background'],
  ['dark', 'Footer and dark band'],
]

export const BLANK_TOKENS = {
  scheme: 'light',
  shape: 'rounded',
  heading_font: 'newsreader',
  body_font: 'dm-sans',
  logo_font: 'heading',
  colors: { bg: '#ffffff', surface: '#ffffff', text: '#1f1826', accent: '#6d3aa6', on_accent: '#ffffff', tint: '#f5f0fb', dark: '#261a33' },
}

// The CSS variables for a theme. Put the result on an element's `style`;
// everything inside it picks the theme up (see the `.site` rules in global.css).
export function themeStyle(baseTokens, typography) {
  if (!baseTokens) return undefined
  const tokens = withTypography(baseTokens, typography)
  const heading = HEADING_FONTS[tokens.heading_font] || HEADING_FONTS.newsreader
  const body = BODY_FONTS[tokens.body_font] || BODY_FONTS['dm-sans']
  const shape = SHAPES[tokens.shape] || SHAPES.rounded
  const script = tokens.logo_font === 'script'
  const c = tokens.colors
  return {
    colorScheme: tokens.scheme === 'dark' ? 'dark' : 'light',
    '--bg': c.bg,
    '--surface': c.surface,
    '--ink': c.text,
    '--purple': c.accent,
    '--on-accent': c.on_accent,
    '--lav': c.tint,
    '--night': c.dark,
    '--serif': heading.family,
    '--sans': body.family,
    '--heading-weight': heading.weight,
    '--heading-tracking': heading.tracking,
    '--heading-scale': (HEADING_SCALES[typography?.heading_scale] || HEADING_SCALES.normal)[1],
    '--heading-case': typography?.heading_case === 'uppercase' ? 'uppercase' : 'none',
    '--script': script ? "'Allura', 'Brush Script MT', cursive" : heading.family,
    '--logo-size': script ? '2rem' : '1.350rem',
    '--logo-weight': script ? 400 : Math.max(heading.weight, 500),
    '--radius': shape.radius,
    '--radius-sm': shape.small,
    '--radius-lg': shape.large,
    '--radius-pill': shape.pill,
  }
}

// Loads the Google Fonts a theme needs (once each).
export function loadThemeFonts(baseTokens, typography) {
  const tokens = withTypography(baseTokens, typography)
  if (!tokens) return
  loadGoogleFont(HEADING_FONTS[tokens.heading_font]?.google)
  loadGoogleFont(BODY_FONTS[tokens.body_font]?.google)
}

function loadGoogleFont(spec) {
  if (!spec) return
  const id = `font-${spec.split(':')[0]}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`
  document.head.appendChild(link)
}

// Loads the fonts used by single texts (site.text_styles).
export function loadTextFonts(styles) {
  for (const style of Object.values(styles || {})) loadGoogleFont(FONTS[style.font]?.google)
}
