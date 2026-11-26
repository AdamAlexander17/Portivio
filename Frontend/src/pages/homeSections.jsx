// The blocks a home page is built from. Home.jsx renders them in the order the
// site's owner chose (site.home_sections). Each block hides itself when it has no content.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fileUrl } from '../api/client'
import ContactSection from '../components/ContactSection'
import CtaBanner from '../components/CtaBanner'
import ProjectCard from '../components/ProjectCard'
import { Arrow, Paragraphs, RichText, sameLabel, twoDigits } from '../components/ui'
import E, { M } from '../components/Editable'
import { useSite, useSiteNav } from '../context/SiteContext'
import { useFetch } from '../hooks'
import { Faq } from './Services'

const HOME_PROJECT_LIMIT = 4

function Highlights() {
  const { texts, sections } = useSite()
  if (!sections.highlights.length) return null
  return (
    <section className="strip" aria-label={texts.highlights_label}>
      <div className="container strip__inner">
        <E k="highlights_label" as="p" className="eyebrow strip__label" />
        <ol className="strip__list">
          {sections.highlights.map((item, index) => (
            <M k={`item_${item.id}`} as="li" key={item.id}>
              <span>{twoDigits(index + 1)}</span>
              <E item={item} />
            </M>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Projects() {
  const { texts, settings } = useSite()
  // The filter tabs are the site's own categories; none means no tabs.
  const filters = settings?.project_filters || []
  const { base, username } = useSiteNav()
  const { data: projects, loading } = useFetch(() => api.projects(username), [username])
  const [filter, setFilter] = useState('all')

  const shown = (projects || [])
    .filter((project) => filter === 'all' || project.platforms.some((tag) => sameLabel(tag, filter)))
    .slice(0, HOME_PROJECT_LIMIT)

  return (
    <section className="section">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <E k="work_eyebrow" as="p" className="eyebrow" />
            <E k="work_title" as="h2" className="h2" rich />
          </div>
          {filters.length > 0 && (
            <div className="filters" role="group" aria-label="Filter">
              {['all', ...filters].map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`chip chip--choice ${filter === option ? 'is-active' : ''}`}
                  aria-pressed={filter === option}
                  onClick={() => setFilter(option)}
                >
                  {option === 'all' ? 'All' : option}
                </button>
              ))}
            </div>
          )}
        </div>

        {shown.length > 0 ? (
          <div className="project-grid">
            {shown.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="empty">{loading ? 'Loading…' : 'Nothing in this category yet.'}</p>
        )}

        {(projects || []).length > HOME_PROJECT_LIMIT && (
          <div className="center">
            <Link to={`${base}/projects`} className="btn btn--outline">
              See all <Arrow />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function Stats() {
  const { texts, sections } = useSite()
  if (!sections.stats.length) return null
  return (
    <section className="section section--lav section--compact">
      <div className="container">
        {texts.stats_title && (
          <E k="stats_title" as="h2" className="h2" rich />
        )}
        <dl className="stat-grid">
          {sections.stats.map((stat) => (
            <M k={`item_${stat.id}`} as="div" className="stat" key={stat.id}>
              <E item={stat} field="body" as="dt" />
              <E item={stat} field="title" as="dd" />
            </M>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Process() {
  const { texts, sections } = useSite()
  if (!sections.process.length) return null
  return (
    <section className="section section--lav">
      <div className="container">
        <E k="process_eyebrow" as="p" className="eyebrow" />
        <E k="process_title" as="h2" className="h2" rich />
        <ol className="step-grid">
          {sections.process.map((step, index) => (
            <M k={`item_${step.id}`} as="li" className="step" key={step.id}>
              <span className="step__number">{twoDigits(index + 1)}</span>
              <E item={step} field="title" as="h3" className="step__title" />
              <E item={step} field="body" as="p" />
            </M>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Services() {
  const { texts, sections } = useSite()
  const { base } = useSiteNav()
  if (!sections.services.length) return null
  return (
    <section className="section">
      <div className="container">
        <E k="offer_title" as="h2" className="h2" />
        <div className="service-grid">
          {sections.services.map((service) => (
            <M k={`item_${service.id}`} as="article" className="service" key={service.id}>
              <E item={service} field="title" as="h3" className="service__title" />
              <E item={service} field="body" as="p" />
            </M>
          ))}
        </div>
        <div className="center">
          <Link to={`${base}/services`} className="btn btn--outline">
            All services <Arrow />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const { texts, sections } = useSite()
  if (!sections.testimonials.length) return null
  return (
    <section className="section">
      <div className="container">
        <E k="testimonials_title" as="h2" className="h2" rich />
        <div className="quote-grid">
          {sections.testimonials.map((item) => (
            <M k={`item_${item.id}`} as="figure" className="quote" key={item.id}>
              <span className="quote__mark" aria-hidden="true">
                “
              </span>
              <E item={item} field="body" as="blockquote" />
              <figcaption>
                <E item={item} field="title" as="strong" />
                {item.meta && <E item={item} field="meta" as="span" />}
              </figcaption>
            </M>
          ))}
        </div>
      </div>
    </section>
  )
}

function Experience() {
  const { texts, sections } = useSite()
  if (!sections.experience.length) return null
  return (
    <section className="section section--lav">
      <div className="container">
        <E k="experience_title" as="h2" className="h2" />
        <ul className="timeline">
          {sections.experience.map((job) => (
            <M k={`item_${job.id}`} as="li" key={job.id}>
              <E item={job} field="title" as="h3" />
              <E item={job} field="body" as="p" />
              <E item={job} field="meta" as="span" />
            </M>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Skills() {
  const { texts, sections } = useSite()
  if (!sections.skills.length) return null
  return (
    <section className="section section--lav">
      <div className="container">
        <E k="skills_title" as="h2" className="h2" />
        <div className="skill-grid">
          {sections.skills.map((group) => (
            <div key={group.id}>
              <E item={group} field="title" as="h3" className="eyebrow eyebrow--muted" />
              <div className="chips">
                {group.items.map((skill) => (
                  <span className="chip chip--white" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqBlock() {
  const { texts, sections } = useSite()
  const [openId, setOpenId] = useState(null)
  if (!sections.faqs.length) return null
  return (
    <section className="section">
      <div className="container">
        <E k="faq_title" as="h2" className="h2" />
        <div className="faq-list">
          {sections.faqs.map((item) => (
            <Faq key={item.id} item={item} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />
          ))}
        </div>
      </div>
    </section>
  )
}

// The dark highlight band. It stays hidden until its heading has text.
function Teach() {
  const { texts } = useSite()
  const { base } = useSiteNav()
  if (!texts.teach_title) return null
  return (
    <section className="teach">
      <div className="container teach__grid">
        <div>
          <E k="teach_eyebrow" as="p" className="eyebrow eyebrow--light" />
          <E k="teach_title" as="h2" className="h2 h2--light" rich />
        </div>
        <div>
          <E k="teach_body" as="p" className="teach__body" />
          <E k="teach_roles" as="p" className="teach__roles" />
          {texts.teach_button && (
            <E k="teach_button" as={Link} to={`${base}/contact?topic=Training%20%2F%20workshop`} className="btn btn--light" />
          )}
        </div>
      </div>
    </section>
  )
}

// A block the site's owner built: heading, text, optional image and button.
export function CustomBlock({ section }) {
  const { base } = useSiteNav()
  const url = section.button_url
  const onSite = url.startsWith('/')
  return (
    <section className={`section custom custom--${section.background} ${section.image ? `custom--image-${section.image_side}` : ''}`}>
      <div className="container custom__grid">
        <div className="custom__text">
          {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
          {section.title && (
            <h2 className="h2">
              <RichText text={section.title} />
            </h2>
          )}
          <Paragraphs text={section.body} className="custom__body" />
          {section.button_label && url && (
            <div className="actions">
              {onSite ? (
                <Link to={`${base}${url}`} className="btn btn--primary">
                  {section.button_label} <Arrow />
                </Link>
              ) : (
                <a href={url} target="_blank" rel="noreferrer" className="btn btn--primary">
                  {section.button_label} <Arrow />
                </a>
              )}
            </div>
          )}
        </div>
        {section.image && <img className="custom__image" src={fileUrl(section.image)} alt="" loading="lazy" />}
      </div>
    </section>
  )
}

// key (as stored in site.home_sections) -> component
export const HOME_BLOCKS = {
  highlights: Highlights,
  projects: Projects,
  stats: Stats,
  process: Process,
  services: Services,
  testimonials: Testimonials,
  experience: Experience,
  skills: Skills,
  faq: FaqBlock,
  teach: Teach,
  contact: ContactSection,
  cta: CtaBanner,
}
