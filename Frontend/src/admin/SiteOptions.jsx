import { useState } from 'react'
import { api } from '../api/client'
import { Feedback, Field, Icon, linesToList, listToLines, useAction } from './adminUi'

// The short lists that make a site fit its owner's kind of work:
// the categories work is filtered by, and the choices on the contact form.
export default function SiteOptions({ site, onSaved }) {
  const { busy, error, notice, run } = useAction()
  const [form, setForm] = useState({
    project_filters: listToLines(site.settings.project_filters),
    contact_topics: listToLines(site.settings.contact_topics),
    budget_options: listToLines(site.settings.budget_options),
  })
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    const saved = await run(
      () =>
        api.updateSettings({
          profession: site.settings.profession,
          hidden: site.settings.hidden, // set in the Design Studio; kept as it is here
          project_filters: linesToList(form.project_filters),
          contact_topics: linesToList(form.contact_topics),
          budget_options: linesToList(form.budget_options),
        }),
      'Options saved. The site is updated.',
    )
    if (saved) onSaved()
  }

  return (
    <form className="adm-card adm-form" onSubmit={submit}>
      <div>
        <h2>Categories and form options</h2>
        <p className="adm-muted">One per line. These make the site fit your kind of work.</p>
      </div>
      <Feedback error={error} notice={notice} />
      <div className="adm-grid">
        <Field label="Work categories" hint="The filter tabs above your work, for example Web, Mobile or Tax, Audit. Leave empty for no tabs.">
          <textarea rows={5} value={form.project_filters} onChange={set('project_filters')} />
        </Field>
        <Field label="Contact form topics" hint='The choices under "What is this about?".'>
          <textarea rows={5} value={form.contact_topics} onChange={set('contact_topics')} />
        </Field>
        <Field label="Budget choices" hint="Leave empty to hide the budget question on the contact form.">
          <textarea rows={5} value={form.budget_options} onChange={set('budget_options')} />
        </Field>
      </div>
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Save options'}
        </button>
      </div>
    </form>
  )
}
