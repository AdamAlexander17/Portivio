// Describes each editable list: where it shows on the site and which fields it uses.
// A field is shown in the admin form only when it has a label here.
export const SECTIONS = {
  highlights: {
    label: 'What I bring',
    page: 'Home',
    intro: 'The numbered strip under the hero.',
    title: 'Title',
  },
  process: {
    label: 'Process steps',
    page: 'Home',
    intro: 'The "How a project runs" cards.',
    title: 'Step name',
    body: 'Description',
  },
  stats: {
    label: 'Stats',
    page: 'Home',
    intro: 'Big numbers, for example "30+" with the label "Trusted clients". Turn the block on in the Design Studio.',
    title: 'Number',
    body: 'Label',
  },
  testimonials: {
    label: 'Testimonials',
    page: 'Home',
    intro: 'Quotes from clients or colleagues. Turn the block on in the Design Studio.',
    title: 'Name',
    meta: 'Role or company',
    body: 'Quote',
  },
  services: {
    label: 'Services',
    page: 'Services',
    intro: 'The "What I offer" list.',
    title: 'Service name',
    body: 'Description',
    items: 'Typical deliverables',
    meta: 'Button label',
  },
  industries: {
    label: 'Industries',
    page: 'Services',
    intro: 'The "Industries I design for" cards.',
    title: 'Industry',
    body: 'Description',
  },
  faqs: {
    label: 'FAQ',
    page: 'Services',
    intro: 'Questions and answers. The first one is open by default.',
    title: 'Question',
    body: 'Answer',
  },
  practices: {
    label: 'Practices',
    page: 'About',
    intro: 'The large cards under the About header. They alternate light and dark.',
    title: 'Title',
    body: 'Description',
  },
  experience: {
    label: 'Experience',
    page: 'About',
    intro: 'Jobs and education, newest first.',
    title: 'Role and company',
    body: 'Description',
    meta: 'Dates',
  },
  principles: {
    label: 'How I work',
    page: 'About',
    intro: 'The numbered principle cards.',
    title: 'Title',
    body: 'Description',
  },
  skills: {
    label: 'Skills and tools',
    page: 'About',
    intro: 'Each entry is one group of skills.',
    title: 'Group name',
    items: 'Skills',
  },
}

export const SECTION_PAGES = ['Home', 'Services', 'About']
