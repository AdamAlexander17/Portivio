import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, fileUrl } from '../api/client'
import { sameLabel } from '../components/ui'
import { publicBase, useSiteState } from '../context/SiteContext'
import { Feedback, Field, Icon, linesToList, listToLines, MoveButtons, moved, PageHeader, useAction, useConfirm } from './adminUi'
import CaseStudyEditor from './CaseStudyEditor'

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif'

const EMPTY = {
  title: '',
  category: '',
  platforms: [],
  summary: '',
  description: '',
  role: '',
  client: '',
  timeline: '',
  skills: '',
  live_url: '',
  case_url: '',
  is_featured: false,
  is_published: true,
}

const toForm = (project) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((key) => [key, project[key]])),
  skills: listToLines(project.skills),
})

export function ProjectDetailsForm({ project, onSaved, onCancel }) {
  const navigate = useNavigate()
  // The site's own categories (set under Site content > Text, menus and options).
  const categories = useSiteState().site?.settings?.project_filters || []
  const { busy, error, notice, run } = useAction()
  const [form, setForm] = useState(project ? toForm(project) : EMPTY)
  const [thumbnail, setThumbnail] = useState(null) // chosen while creating; uploaded right after

  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm({ ...form, [field]: value })
  }
  const togglePlatform = (value) =>
    setForm({
      ...form,
      platforms: form.platforms.some((tag) => sameLabel(tag, value))
        ? form.platforms.filter((tag) => !sameLabel(tag, value))
        : [...form.platforms, value],
    })

  async function submit(event) {
    event.preventDefault()
    const payload = { ...form, skills: linesToList(form.skills) }

    if (project) {
      const saved = await run(() => api.updateProject(project.id, payload), 'Project saved.')
      if (saved) onSaved(saved)
      return
    }

    const created = await run(async () => {
      const result = await api.createProject(payload)
      if (thumbnail) await api.uploadThumbnail(result.id, thumbnail).catch(() => null)
      return result
    })
    if (created) navigate(`/admin/projects/${created.id}`, { replace: true, state: { created: true } })
  }

  return (
    <form className={onCancel ? 'adm-form' : 'adm-card adm-form'} onSubmit={submit}>
      {!onCancel && <h2>Details</h2>}
      <Field label="Project title">
        <input type="text" required maxLength={150} value={form.title} onChange={set('title')} />
      </Field>
      <Field label="Category line" hint='The small line above the title, for example "Web app · Fintech".'>
        <input type="text" maxLength={150} value={form.category} onChange={set('category')} />
      </Field>

      <fieldset className="adm-field">
        <legend className="adm-field__label">Categories (the filter tabs this appears under)</legend>
        <div className="adm-row">
          {categories.map((category) => (
            <label className="adm-check" key={category}>
              <input
                type="checkbox"
                checked={form.platforms.some((tag) => sameLabel(tag, category))}
                onChange={() => togglePlatform(category)}
              />
              {category}
            </label>
          ))}
          {categories.length === 0 && (
            <span className="adm-muted">
              No categories yet. Add some under <Link className="adm-link" to="/admin/texts">Text, menus and options</Link>.
            </span>
          )}
        </div>
      </fieldset>

      <Field label="Short summary" hint="One or two sentences. Shown on the project card.">
        <textarea rows={2} maxLength={500} value={form.summary} onChange={set('summary')} />
      </Field>
      <Field label="Full description" hint="The complete explanation on the project page. Leave an empty line between paragraphs.">
        <textarea rows={onCancel ? 4 : 10} maxLength={20000} value={form.description} onChange={set('description')} />
      </Field>

      <div className="adm-grid">
        <Field label="Your role">
          <input type="text" maxLength={150} placeholder="Lead UI/UX designer" value={form.role} onChange={set('role')} />
        </Field>
        <Field label="Client">
          <input type="text" maxLength={150} value={form.client} onChange={set('client')} />
        </Field>
        <Field label="Timeline">
          <input type="text" maxLength={100} placeholder="8 weeks, 2025" value={form.timeline} onChange={set('timeline')} />
        </Field>
      </div>

      <Field label="Skills and deliverables" hint="One per line.">
        <textarea rows={4} value={form.skills} onChange={set('skills')} />
      </Field>

      <div className="adm-grid">
        <Field label="Live project link (optional)">
          <input type="url" maxLength={500} placeholder="https://" value={form.live_url} onChange={set('live_url')} />
        </Field>
        <Field label="Case study link (optional)" hint="Behance, Figma or similar.">
          <input type="url" maxLength={500} placeholder="https://" value={form.case_url} onChange={set('case_url')} />
        </Field>
      </div>

      {!project && (
        <Field label="Thumbnail" hint="The card image. You can add the gallery images after saving.">
          <input type="file" accept={IMAGE_TYPES} onChange={(event) => setThumbnail(event.target.files[0] || null)} />
        </Field>
      )}

      <div className="adm-row">
        <label className="adm-check">
          <input type="checkbox" checked={form.is_published} onChange={set('is_published')} />
          Published (visible on the site)
        </label>
        <label className="adm-check">
          <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} />
          Featured (large card on the Projects page)
        </label>
      </div>

      <Feedback error={error} notice={notice} />
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          <Icon name="check" /> {busy ? 'Saving…' : project ? 'Save changes' : 'Create project'}
        </button>
        {onCancel ? (
          <button type="button" className="adm-btn" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <Link to="/admin/projects" className="adm-btn">
            {project ? 'Back to projects' : 'Cancel'}
          </Link>
        )}
      </div>
    </form>
  )
}

function Thumbnail({ project, onChanged }) {
  const input = useRef(null)
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()

  async function choose(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    const updated = await run(() => api.uploadThumbnail(project.id, file), 'Thumbnail updated.')
    if (updated) onChanged(updated)
  }

  async function remove() {
    if (!(await confirm('Remove the thumbnail?'))) return
    const updated = await run(() => api.deleteThumbnail(project.id), 'Thumbnail removed.')
    if (updated) onChanged(updated)
  }

  return (
    <div className="adm-card adm-upload">
      <div className="adm-upload__preview adm-upload__preview--wide">
        {project.thumbnail ? <img src={fileUrl(project.thumbnail)} alt="" /> : <span>No thumbnail</span>}
      </div>
      <div>
        <h2>Thumbnail</h2>
        <p className="adm-muted">The image on the project card. A landscape image around 1600 × 1100 px works best.</p>
        <Feedback error={error} notice={notice} />
        <div className="adm-row">
          <input ref={input} type="file" accept={IMAGE_TYPES} hidden onChange={choose} />
          <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => input.current.click()}>
            <Icon name="upload" /> {busy ? 'Uploading…' : project.thumbnail ? 'Replace thumbnail' : 'Upload thumbnail'}
          </button>
          {project.thumbnail && (
            <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={remove}>
              <Icon name="trash" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function GalleryImage({ image, index, count, busy, onMove, onDelete, onCaption }) {
  const [caption, setCaption] = useState(image.caption)
  return (
    <li className="adm-gallery__item">
      <img src={fileUrl(image.image)} alt="" loading="lazy" />
      <input
        type="text"
        maxLength={255}
        placeholder="Caption (optional)"
        aria-label="Caption"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        onBlur={() => caption !== image.caption && onCaption(caption)}
      />
      <div className="adm-row adm-row--between">
        <MoveButtons index={index} count={count} disabled={busy} onMove={onMove} />
        <button type="button" className="adm-btn adm-btn--danger adm-btn--small" disabled={busy} onClick={onDelete}>
          <Icon name="trash" /> Delete
        </button>
      </div>
    </li>
  )
}

function Gallery({ project, onChanged }) {
  const input = useRef(null)
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()

  const apply = async (action, message) => {
    const updated = await run(action, message)
    if (updated) onChanged(updated)
  }

  function choose(event) {
    const files = [...event.target.files]
    event.target.value = ''
    if (files.length) apply(() => api.uploadProjectImages(project.id, files), `${files.length} image${files.length > 1 ? 's' : ''} added.`)
  }

  function move(index, step) {
    const next = moved(project.images, index, step)
    if (next !== project.images) apply(() => api.reorderProjectImages(project.id, next.map((image) => image.id)))
  }

  return (
    <div className="adm-card">
      <h2>Gallery images</h2>
      <p className="adm-muted">
        The screens shown on the project page, top to bottom in this order. Visitors can click any image to view it full screen.
      </p>
      <Feedback error={error} notice={notice} />
      <div className="adm-row">
        <input ref={input} type="file" accept={IMAGE_TYPES} multiple hidden onChange={choose} />
        <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => input.current.click()}>
          <Icon name="plus" /> {busy ? 'Working…' : 'Add images'}
        </button>
      </div>

      {project.images.length > 0 && (
        <ul className="adm-gallery">
          {project.images.map((image, index) => (
            <GalleryImage
              key={image.id}
              image={image}
              index={index}
              count={project.images.length}
              busy={busy}
              onMove={(step) => move(index, step)}
              onCaption={(caption) => apply(() => api.setImageCaption(image.id, caption), 'Caption saved.')}
              onDelete={async () =>
                (await confirm('Delete this image?')) && apply(() => api.deleteProjectImage(image.id), 'Image deleted.')
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ProjectForm() {
  const { id } = useParams()
  const siteBase = publicBase(useSiteState().site?.owner)
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setProject(null)
    setError('')
    if (id) api.adminProject(id).then(setProject).catch((err) => setError(err.message))
  }, [id])

  if (!id) {
    return (
      <>
        <PageHeader title="New project" intro="Fill in the details first. Gallery images are added after the project is created." />
        <ProjectDetailsForm project={null} />
      </>
    )
  }

  if (error) return <Feedback error={error} />
  if (!project) return <Feedback notice="Loading…" />

  return (
    <>
      <PageHeader title={project.title} intro="Changes show on the site as soon as they are saved.">
        {project.is_published && (
          <a href={`${siteBase}/projects/${project.slug}`} target="_blank" rel="noreferrer" className="adm-btn">
            <Icon name="external" /> View on site
          </a>
        )}
      </PageHeader>
      <Thumbnail project={project} onChanged={setProject} />
      <Gallery project={project} onChanged={setProject} />
      <ProjectDetailsForm key={project.id} project={project} onSaved={setProject} />
      <CaseStudyEditor key={`case-${project.id}`} project={project} onSaved={setProject} />
    </>
  )
}
