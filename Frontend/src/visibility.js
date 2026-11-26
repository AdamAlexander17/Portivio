// Every page and page part a site's owner can switch off, grouped for the
// "Show / hide" tab of the Design Studio. A site stores the keys it hides in
// settings.hidden; anything not listed there is shown.
//
// To make another part hideable: add its key here, then wrap that part in
// `shown('<key>') && ...` in the page (see useShown in context/SiteContext.jsx).
export const VISIBILITY_GROUPS = [
  {
    title: 'Pages',
    note: 'A hidden page leaves the menu and the footer, and its address shows "page not found".',
    items: [
      ['page.projects', 'Work / projects page'],
      ['page.services', 'Services page'],
      ['page.about', 'About page'],
      ['page.contact', 'Contact page'],
    ],
  },
  {
    title: 'Home: hero',
    note: 'The top of the home page.',
    items: [
      ['hero.eyebrow', 'Small line above the heading'],
      ['hero.intro', 'Introduction text'],
      ['hero.primary', 'Main button'],
      ['hero.secondary', 'Second button'],
      ['hero.resume', 'Download resume button'],
      ['hero.stats', 'Stats line'],
      ['hero.photo', 'Photo'],
      ['hero.caption', 'Caption under the photo'],
    ],
  },
  {
    title: 'Services page',
    items: [
      ['services.offer', 'List of services'],
      ['services.industries', 'Industries'],
      ['services.faq', 'FAQ'],
      ['services.cta', 'Banner at the bottom'],
    ],
  },
  {
    title: 'About page',
    items: [
      ['about.photo', 'Photo'],
      ['about.resume', 'Download resume button'],
      ['about.practices', 'Practice cards'],
      ['about.experience', 'Experience'],
      ['about.principles', 'How I work'],
      ['about.skills', 'Skills and tools'],
      ['about.cta', 'Banner at the bottom'],
    ],
  },
  {
    title: 'Menu and footer',
    items: [
      ['nav.button', 'Button in the menu'],
      ['projects.cta', 'Banner under the work page'],
      ['footer.pages', 'Footer: page links'],
      ['footer.social', 'Footer: social links'],
      ['footer.location', 'Footer: location'],
    ],
  },
]

export const isShown = (site, key) => !(site?.settings?.hidden || []).includes(key)
