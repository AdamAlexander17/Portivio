// The parts of a site whose arrangement can be chosen, and the styles each part offers.
//
// A layout PRESET (stored in the database) sets every part at once. On top of that a
// site can choose its own style for any single part (Design Studio > Layout). The result
// is applied as data attributes on the .site wrapper (data-nav="pill", data-hero="split"…)
// and drawn by the "Layout variants" rules in global.css.
//
// Keep the values in step with Backend/app/schemas/layout.py.
// To add a style to a part: add the value there and here, then write its CSS.

// [key, label, { value: description }]
const PARTS = {
  nav: ['Navbar', {
    classic: 'Classic: links in the middle, button on the right',
    minimal: 'Minimal: links on the right, no button',
    centered: 'Centred: logo above the links',
    pill: 'Floating rounded bar',
  }],
  footer: ['Footer', {
    columns: 'Columns of links',
    simple: 'Simple and centred',
  }],
  width: ['Page width', {
    narrow: 'Narrow',
    standard: 'Standard',
    wide: 'Wide',
  }],
  headings: ['Section headings', {
    left: 'Left aligned',
    center: 'Centred',
  }],
  hero: ['Hero (top of the home page)', {
    split: 'Text on the left, photo on the right',
    reverse: 'Photo on the left, text on the right',
    centered: 'Centred, with a round photo on top',
    statement: 'Huge headline, no photo',
  }],
  projects: ['Projects / work', {
    grid: 'Two cards per row',
    compact: 'Three cards per row',
    list: 'Wide rows, image beside the text',
    overlay: 'Image tiles with the title on top',
  }],
  process: ['Process steps', {
    cards: 'Cards side by side',
    list: 'Numbered list, one step per row',
  }],
  stats: ['Stats', {
    line: 'Numbers in a row',
    cards: 'Each number in its own card',
  }],
  testimonials: ['Testimonials', {
    cards: 'Cards side by side',
    large: 'One large quote per row',
  }],
  services: ['Services list', {
    list: 'Two-column list with dividers',
    cards: 'Cards',
  }],
  about: ['About page header', {
    split: 'Text on the left, photo on the right',
    reverse: 'Photo on the left, text on the right',
    centered: 'Centred, with the photo on top',
  }],
  contact: ['Contact section', {
    split: 'Form with your details beside it',
    centered: 'Form only, centred',
  }],
}

// How the parts are grouped in the Design Studio.
export const LAYOUT_GROUPS = [
  { title: 'Whole site', keys: ['nav', 'footer', 'width', 'headings'] },
  { title: 'Home page', keys: ['hero', 'projects', 'process', 'stats', 'testimonials'] },
  { title: 'Other pages', keys: ['services', 'about', 'contact'] },
]

export const LAYOUT_FIELDS = Object.entries(PARTS).map(([key, [label, choices]]) => [key, label, choices])
export const LAYOUT_PART = (key) => ({ label: PARTS[key][0], choices: PARTS[key][1] })

export const BLANK_OPTIONS = {
  nav: 'classic',
  hero: 'split',
  projects: 'grid',
  headings: 'left',
  footer: 'columns',
  width: 'standard',
  process: 'cards',
  stats: 'line',
  testimonials: 'cards',
  services: 'list',
  about: 'split',
  contact: 'split',
}

// A site's own choices without the empty ones (the server sends null for "follow the preset").
export const cleanCustom = (custom) =>
  Object.fromEntries(Object.entries(custom || {}).filter(([key, value]) => value && key in BLANK_OPTIONS))

// The data attributes for a set of options, to spread onto the .site element.
export function layoutAttrs(options) {
  const chosen = { ...BLANK_OPTIONS, ...cleanCustom(options) }
  return Object.fromEntries(Object.keys(BLANK_OPTIONS).map((key) => [`data-${key}`, chosen[key]]))
}
