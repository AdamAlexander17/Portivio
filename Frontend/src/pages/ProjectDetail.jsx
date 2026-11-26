import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, fileUrl, getToken } from '../api/client'
import CaseStudy from '../components/CaseStudy'
import CtaBanner from '../components/CtaBanner'
import ProjectCard from '../components/ProjectCard'
import { Arrow, Paragraphs } from '../components/ui'
import { useShown, useSiteNav } from '../context/SiteContext'
import NotFound from './NotFound'
import { useFetch } from '../hooks'

// Full-screen image viewer with previous / next and keyboard support.
function Lightbox({ images, index, onClose, onMove }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onMove(1)
      if (event.key === 'ArrowLeft') onMove(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onMove])

  const image = images[index]
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={onClose}>
      <button type="button" className="lightbox__close" aria-label="Close" onClick={onClose}>
        ×
      </button>
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation()
            onMove(-1)
          }}
        >
          ‹
        </button>
      )}
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={fileUrl(image.image)} alt={image.caption || ''} />
        <figcaption>
          {image.caption && <span>{image.caption}</span>}
          <span>
            {index + 1} / {images.length}
          </span>
        </figcaption>
      </figure>
      {images.length > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation()
            onMove(1)
          }}
        >
          ›
        </button>
      )}
    </div>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams()
  const { base, username } = useSiteNav()
  const { data: project, loading, error } = useFetch(() => api.project(slug, username), [slug, username])
  const { data: all } = useFetch(() => api.projects(username), [username])
  const [viewing, setViewing] = useState(null)

  useEffect(() => setViewing(null), [slug])

  // Count the project view once it has loaded (same exceptions as page views).
  const loadedSlug = project?.slug
  useEffect(() => {
    if (loadedSlug && window.parent === window && !getToken()) api.track({ kind: 'project', slug: loadedSlug }, username)
  }, [loadedSlug, username])

  // The thumbnail leads the gallery, followed by the uploaded project images.
  const gallery = project
    ? [...(project.thumbnail ? [{ id: 'thumb', image: project.thumbnail, caption: '' }] : []), ...project.images]
    : []

  const close = useCallback(() => setViewing(null), [])
  const move = useCallback(
    (step) => setViewing((current) => (current + step + gallery.length) % gallery.length),
    [gallery.length],
  )

  const shown = useShown()
  if (!shown('page.projects')) return <NotFound />

  if (loading) {
    return (
      <div className="page-state">
        <div className="spinner" role="status" aria-label="Loading" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <section className="section section--top">
        <div className="container">
          <h1 className="h1">Page not found</h1>
          <p className="lead">This project may have been removed or is not published.</p>
          <Link to={`${base}/projects`} className="btn btn--primary">
            Back
          </Link>
        </div>
      </section>
    )
  }

  const facts = [
    ['Role', project.role],
    ['Client', project.client],
    ['Timeline', project.timeline],
  ].filter(([, value]) => value)
  const more = (all || []).filter((other) => other.slug !== project.slug).slice(0, 2)

  return (
    <>
      <article className="section section--top">
        <div className="container">
          <Link to={`${base}/projects`} className="back-link">
            ‹ Back to all
          </Link>

          <header className="detail-head">
            {project.category && <p className="eyebrow">{project.category}</p>}
            <h1 className="h1">{project.title}</h1>
            {project.summary && <p className="lead lead--narrow">{project.summary}</p>}
          </header>

          <div className="detail">
            <aside className="detail__info">
              {facts.length > 0 && (
                <dl className="facts">
                  {facts.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {project.description && (
                <div className="detail__block">
                  <h2 className="detail__label">Overview</h2>
                  <Paragraphs text={project.description} className="detail__text" />
                </div>
              )}

              {project.skills.length > 0 && (
                <div className="detail__block">
                  <h2 className="detail__label">Skills and deliverables</h2>
                  <div className="chips">
                    {project.skills.map((skill) => (
                      <span className="chip" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(project.live_url || project.case_url) && (
                <div className="detail__block actions">
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noreferrer" className="btn btn--primary">
                      View live <Arrow />
                    </a>
                  )}
                  {project.case_url && (
                    <a href={project.case_url} target="_blank" rel="noreferrer" className="btn btn--outline">
                      Full case study <Arrow />
                    </a>
                  )}
                </div>
              )}
            </aside>

            <div className="detail__gallery">
              {gallery.length === 0 && <p className="empty">Images for this project will be added soon.</p>}
              {gallery.map((image, index) => (
                <figure key={image.id}>
                  <button type="button" onClick={() => setViewing(index)} aria-label="Open image full screen">
                    <img src={fileUrl(image.image)} alt={image.caption || `${project.title} screen ${index + 1}`} loading={index ? 'lazy' : 'eager'} />
                  </button>
                  {image.caption && <figcaption>{image.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </div>
      </article>

      <CaseStudy blocks={project.content} />

      {more.length > 0 && (
        <section className="section section--lav">
          <div className="container">
            <h2 className="h2">More to see</h2>
            <div className="project-grid">
              {more.map((other) => (
                <ProjectCard key={other.id} project={other} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBanner />

      {viewing !== null && gallery[viewing] && (
        <Lightbox images={gallery} index={viewing} onClose={close} onMove={move} />
      )}
    </>
  )
}
