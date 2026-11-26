import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useSite, useSiteNav } from '../context/SiteContext'
import E, { M } from './Editable'
import { Arrow } from './ui'

const MAX_MESSAGE = 4000

const emptyForm = (topic, budget) => ({
  name: '',
  email: '',
  topic,
  company: '',
  budget,
  message: '',
  website: '',
  consent: false,
})

// The contact form and side panel. Used on the home page and the contact page.
export default function ContactSection({ as: Heading = 'h2' }) {
  const { profile, texts, settings } = useSite()
  // Each site sets its own topics and budget choices; no budget choices hides that field.
  const TOPICS = settings?.contact_topics?.length ? settings.contact_topics : ['General']
  const BUDGETS = settings?.budget_options || []
  const { username } = useSiteNav()
  const [params] = useSearchParams()
  const asked = params.get('topic')
  const initialTopic = TOPICS.includes(asked) ? asked : TOPICS[0]

  const [form, setForm] = useState(() => emptyForm(initialTopic, BUDGETS[0] || ''))
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [error, setError] = useState('')

  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setStatus('sending')
    try {
      const { consent: _consent, ...payload } = form
      await api.sendMessage(payload, username)
      setStatus('sent')
      setForm(emptyForm(initialTopic, BUDGETS[0] || ''))
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  return (
    <section className="section" id="contact">
      <div className="container">
        <E k="contact_eyebrow" as="p" className="eyebrow" />
        <E k="contact_title" as={Heading} className="h2" rich />
        <E k="contact_intro" as="p" className="lead lead--narrow" />

        <div className="contact-grid">
          {status === 'sent' ? (
            <div className="form-done" role="status">
              <h3 className="h3">Message sent.</h3>
              <p>Thank you for writing. I will reply to the email address you gave.</p>
              <button type="button" className="btn btn--outline" onClick={() => setStatus('idle')}>
                Send another message
              </button>
            </div>
          ) : (
            <M k="contact_form" as="form" className="form" onSubmit={submit}>
              <div className="form__row">
                <M k="contact_name" as="label" className="field">
                  <span>Your name</span>
                  <input type="text" required maxLength={120} autoComplete="name" value={form.name} onChange={set('name')} />
                </M>
                <M k="contact_email" as="label" className="field">
                  <span>Email</span>
                  <input type="email" required maxLength={255} autoComplete="email" value={form.email} onChange={set('email')} />
                </M>
              </div>

              <M k="contact_topic" as="fieldset" className="field">
                <legend>What is this about?</legend>
                <div className="chips">
                  {TOPICS.map((topic) => (
                    <button
                      type="button"
                      key={topic}
                      className={`chip chip--choice ${form.topic === topic ? 'is-active' : ''}`}
                      aria-pressed={form.topic === topic}
                      onClick={() => setForm((current) => ({ ...current, topic }))}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </M>

              <div className="form__row">
                <M k="contact_company" as="label" className="field">
                  <span>Company (optional)</span>
                  <input type="text" maxLength={150} autoComplete="organization" value={form.company} onChange={set('company')} />
                </M>
                {BUDGETS.length > 0 && (
                  <M k="contact_budget" as="label" className="field">
                    <span>Budget (optional)</span>
                    <select value={form.budget} onChange={set('budget')}>
                      {BUDGETS.map((budget) => (
                        <option key={budget}>{budget}</option>
                      ))}
                    </select>
                  </M>
                )}
              </div>

              <M k="contact_message" as="label" className="field">
                <span>Message</span>
                <textarea
                  required
                  rows={7}
                  maxLength={MAX_MESSAGE}
                  placeholder="What are you building, and where are you stuck?"
                  value={form.message}
                  onChange={set('message')}
                />
                <small className="field__count">
                  {form.message.length} / {MAX_MESSAGE}
                </small>
              </M>

              {/* Hidden from people; bots that fill it in are ignored by the server. */}
              <input
                type="text"
                className="visually-hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={set('website')}
              />

              <M k="contact_consent" as="label" className="check">
                <input type="checkbox" required checked={form.consent} onChange={set('consent')} />
                <span>{profile.name.split(' ')[0]} may use these details to reply to this message. They are not added to any mailing list.</span>
              </M>

              {error && (
                <p className="form__error" role="alert">
                  {error}
                </p>
              )}

              <M k="contact_submit" as="div" className="form__submit">
                <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send message'} <Arrow />
                </button>
                <small>Your details are only used to reply to this message.</small>
              </M>
            </M>
          )}

          <M k="contact_side" as="aside" className="contact-side">
            {profile.email && (
              <M k="contact_side_email" as="div" className="contact-side__block">
                <h3 className="contact-side__label">Email</h3>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </M>
            )}
            {(profile.linkedin_url || profile.behance_url) && (
              <M k="contact_side_links" as="div" className="contact-side__block">
                <h3 className="contact-side__label">Elsewhere</h3>
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                )}
                {profile.behance_url && (
                  <a href={profile.behance_url} target="_blank" rel="noreferrer">
                    Behance
                  </a>
                )}
                <E k="contact_connect" as="p" />
              </M>
            )}
            {profile.location && (
              <M k="contact_side_place" as="div" className="contact-side__block">
                <h3 className="contact-side__label">Based in</h3>
                <p>
                  {profile.location}. {texts.location_note}
                </p>
              </M>
            )}
          </M>
        </div>
      </div>
    </section>
  )
}
