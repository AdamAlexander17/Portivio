import { useRef, useState } from 'react'
import { api, fileUrl, resumeUrl } from '../api/client'
import { useSiteState } from '../context/SiteContext'
import { Feedback, Field, Icon, PageHeader, useAction, useConfirm } from './adminUi'

const IMAGES = [
  { field: 'hero_image', label: 'Home page photo', hint: 'Shown in the hero. A square photo works best.' },
  { field: 'about_image', label: 'About page photo', hint: 'A portrait (4:5) photo works best. Falls back to the home photo.' },
]

function ImageCard({ config, path, onChanged }) {
  const input = useRef(null)
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()

  async function choose(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    const done = await run(() => api.uploadProfileImage(config.field, file), 'Photo updated.')
    if (done) onChanged()
  }

  async function remove() {
    if (!(await confirm('Remove this photo?'))) return
    const done = await run(() => api.deleteProfileImage(config.field), 'Photo removed.')
    if (done) onChanged()
  }

  return (
    <div className="adm-card adm-upload">
      <div className="adm-upload__preview">{path ? <img src={fileUrl(path)} alt="" /> : <span>No photo</span>}</div>
      <div>
        <h2>{config.label}</h2>
        <p className="adm-muted">{config.hint}</p>
        <Feedback error={error} notice={notice} />
        <div className="adm-row">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={choose} />
          <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => input.current.click()}>
            <Icon name="upload" /> {busy ? 'Uploading…' : path ? 'Replace photo' : 'Upload photo'}
          </button>
          {path && (
            <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={remove}>
              <Icon name="trash" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ResumeCard({ profile, owner, onChanged }) {
  const input = useRef(null)
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()

  async function choose(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    const done = await run(() => api.uploadResume(file), 'Resume uploaded.')
    if (done) onChanged()
  }

  async function remove() {
    if (!(await confirm('Remove the resume? The download buttons will disappear from the site.'))) return
    const done = await run(() => api.deleteResume(), 'Resume removed.')
    if (done) onChanged()
  }

  return (
    <div className="adm-card">
      <h2>Resume</h2>
      <p className="adm-muted">
        PDF, DOC or DOCX. Visitors get a "Download resume" button on the home and about pages once a file is uploaded.
      </p>
      <Feedback error={error} notice={notice} />
      <p>
        {profile.has_resume ? (
          <>
            Current file: <a className="adm-link" href={resumeUrl(owner.username)}>{profile.resume_name || 'resume'}</a>
          </>
        ) : (
          'No resume uploaded yet.'
        )}
      </p>
      <div className="adm-row">
        <input ref={input} type="file" accept=".pdf,.doc,.docx" hidden onChange={choose} />
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => input.current.click()}>
          <Icon name="upload" /> {busy ? 'Uploading…' : profile.has_resume ? 'Replace resume' : 'Upload resume'}
        </button>
        {profile.has_resume && (
          <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={remove}>
            <Icon name="trash" /> Remove
          </button>
        )}
      </div>
    </div>
  )
}

function DetailsForm({ profile, onChanged }) {
  const { busy, error, notice, run } = useAction()
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    location: profile.location,
    linkedin_url: profile.linkedin_url,
    behance_url: profile.behance_url,
  })
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    const done = await run(() => api.updateProfile(form), 'Details saved.')
    if (done) onChanged()
  }

  return (
    <form className="adm-card adm-form" onSubmit={submit}>
      <h2>Details</h2>
      <Feedback error={error} notice={notice} />
      <div className="adm-grid">
        <Field label="Full name">
          <input type="text" required maxLength={120} value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email" hint="Shown on the contact section and footer.">
          <input type="email" maxLength={255} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Location">
          <input type="text" maxLength={255} value={form.location} onChange={set('location')} />
        </Field>
        <Field label="LinkedIn link">
          <input type="url" maxLength={500} placeholder="https://" value={form.linkedin_url} onChange={set('linkedin_url')} />
        </Field>
        <Field label="Behance link">
          <input type="url" maxLength={500} placeholder="https://" value={form.behance_url} onChange={set('behance_url')} />
        </Field>
      </div>
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : 'Save details'}
        </button>
      </div>
    </form>
  )
}

export default function ProfileEditor() {
  const { site, error, reload } = useSiteState()

  if (!site) return <Feedback error={error} notice={error ? '' : 'Loading…'} />

  return (
    <>
      <PageHeader title="Profile, photos and resume" intro="Your details and the files visitors see and download." />
      <DetailsForm profile={site.profile} onChanged={reload} />
      {IMAGES.map((config) => (
        <ImageCard key={config.field} config={config} path={site.profile[config.field]} onChanged={reload} />
      ))}
      <ResumeCard profile={site.profile} owner={site.owner} onChanged={reload} />
    </>
  )
}
