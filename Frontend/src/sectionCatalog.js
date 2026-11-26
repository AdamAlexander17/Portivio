// The blocks a home page can be built from: their names in the panel and where their
// content is edited. Keys match Backend/app/core/defaults.py (HOME_SECTION_KEYS)
// and the components in src/pages/homeSections.jsx.
export const HOME_SECTION_INFO = {
  highlights: { label: 'What I bring strip', manage: '/admin/sections/highlights' },
  projects: { label: 'Projects', manage: '/admin/projects' },
  stats: { label: 'Stats (big numbers)', manage: '/admin/sections/stats' },
  process: { label: 'Process steps', manage: '/admin/sections/process' },
  services: { label: 'Services', manage: '/admin/sections/services' },
  testimonials: { label: 'Testimonials', manage: '/admin/sections/testimonials' },
  experience: { label: 'Experience', manage: '/admin/sections/experience' },
  skills: { label: 'Skills and tools', manage: '/admin/sections/skills' },
  faq: { label: 'FAQ', manage: '/admin/sections/faqs' },
  teach: { label: 'Dark highlight band', manage: '/admin/texts' },
  contact: { label: 'Contact form', manage: '/admin/texts' },
  cta: { label: 'Accent banner', manage: '/admin/texts' },
}
