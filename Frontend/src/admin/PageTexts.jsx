import { useState } from 'react'
import { api } from '../api/client'
import { useSiteState } from '../context/SiteContext'
import { Feedback, Field, Icon, PageHeader, useAction } from './adminUi'
import SiteOptions from './SiteOptions'

// [key, label, rows]. More than one row gives a multi-line box.
const GROUPS = [
  {
    title: 'Shared (every page)',
    fields: [
      ['logo_text', 'Logo text', 1],
      ['cta_title', 'Accent banner heading', 2],
      ['footer_tagline', 'Footer tagline', 2],
      ['footer_note', 'Footer note (bottom right)', 1],
      ['location_note', 'Line after your location', 1],
    ],
  },
  {
    title: 'Menu and buttons',
    fields: [
      ['nav_home', 'Menu: home', 1],
      ['nav_projects', 'Menu: work (for example Projects, Portfolio, Clients)', 1],
      ['nav_services', 'Menu: services', 1],
      ['nav_about', 'Menu: about', 1],
      ['nav_contact', 'Menu: contact', 1],
      ['nav_button', 'Button in the menu', 1],
      ['hero_primary_button', 'Home: main button', 1],
      ['hero_secondary_button', 'Home: second button', 1],
      ['project_link_label', 'Link on each work card', 1],
      ['highlights_label', 'Label of the strip under the hero', 1],
      ['projects_eyebrow', 'Work page: small line above the heading', 1],
      ['services_eyebrow', 'Services page: small line above the heading', 1],
      ['services_list_label', 'Services: label above each list', 1],
      ['about_eyebrow', 'About page: small line above the heading', 1],
    ],
  },
  {
    title: 'Home: hero',
    fields: [
      ['hero_eyebrow', 'Small line above the heading', 1],
      ['hero_title', 'Heading', 2],
      ['hero_intro', 'Introduction', 4],
      ['hero_stats', 'Stats line', 1],
      ['hero_caption', 'Caption under the photo', 1],
    ],
  },
  {
    title: 'Home: sections',
    fields: [
      ['work_eyebrow', 'Projects: small line', 1],
      ['work_title', 'Projects: heading', 2],
      ['process_eyebrow', 'Process: small line', 1],
      ['process_title', 'Process: heading', 2],
      ['teach_eyebrow', 'Teaching band: small line', 1],
      ['teach_title', 'Teaching band: heading', 2],
      ['teach_body', 'Teaching band: text', 3],
      ['teach_roles', 'Teaching band: roles line', 1],
      ['teach_button', 'Teaching band: button label', 1],
      ['testimonials_title', 'Testimonials: heading', 2],
      ['stats_title', 'Stats: heading (optional)', 2],
    ],
  },
  {
    title: 'Contact',
    fields: [
      ['contact_eyebrow', 'Small line above the heading', 1],
      ['contact_title', 'Heading', 2],
      ['contact_intro', 'Introduction', 3],
      ['contact_connect', 'Text under the social links', 2],
    ],
  },
  {
    title: 'Projects page',
    fields: [
      ['projects_title', 'Heading', 2],
      ['projects_intro', 'Introduction', 3],
    ],
  },
  {
    title: 'Services page',
    fields: [
      ['services_title', 'Heading', 2],
      ['services_intro', 'Introduction', 3],
      ['offer_title', 'Services list heading', 1],
      ['industries_title', 'Industries heading', 1],
      ['industries_intro', 'Industries introduction', 2],
      ['faq_title', 'FAQ heading', 1],
    ],
  },
  {
    title: 'About page',
    fields: [
      ['about_title', 'Heading', 2],
      ['about_intro', 'Introduction', 4],
      ['practices_title', 'Practices heading', 2],
      ['experience_title', 'Experience heading', 1],
      ['principles_title', 'How I work heading', 1],
      ['skills_title', 'Skills heading', 1],
    ],
  },
]

function TextsForm({ initial, onSaved }) {
  const { busy, error, notice, run } = useAction()
  const [texts, setTexts] = useState(initial)
  const set = (key) => (event) => setTexts({ ...texts, [key]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    const done = await run(() => api.updateTexts(texts), 'Text saved. The site is updated.')
    if (done) onSaved()
  }

  return (
    <form className="adm-columns" onSubmit={submit}>
      {GROUPS.map((group) => (
        <div className="adm-card adm-form" key={group.title}>
          <h2>{group.title}</h2>
          {group.fields.map(([key, label, rows]) => (
            <Field label={label} key={key}>
              {rows > 1 ? (
                <textarea rows={rows} maxLength={3000} value={texts[key] ?? ''} onChange={set(key)} />
              ) : (
                <input type="text" maxLength={300} value={texts[key] ?? ''} onChange={set(key)} />
              )}
            </Field>
          ))}
        </div>
      ))}
      <div className="adm-savebar">
        <Feedback error={error} notice={notice} />
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Save all text'}
        </button>
      </div>
    </form>
  )
}

export default function PageTexts() {
  const { site, error, reload } = useSiteState()

  return (
    <>
      <PageHeader
        title="Text, menus and options"
        intro="In a heading, wrap words in *stars* to show them in the accent colour, and press Enter to start a new line."
      />
      {site && <SiteOptions site={site} onSaved={reload} />}
      {site ? <TextsForm initial={site.texts} onSaved={reload} /> : <Feedback error={error} notice={error ? '' : 'Loading…'} />}
    </>
  )
}
