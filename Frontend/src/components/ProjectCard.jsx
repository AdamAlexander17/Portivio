import { Link } from 'react-router-dom'
import { fileUrl } from '../api/client'
import { useSite, useSiteNav } from '../context/SiteContext'
import { M } from './Editable'
import { Arrow } from './ui'

export default function ProjectCard({ project, featured = false }) {
  const { base } = useSiteNav()
  const { texts } = useSite()
  return (
    <M k={`project_${project.id}`} as={Link} to={`${base}/projects/${project.slug}`} className={`project-card ${featured ? 'project-card--featured' : ''}`}>
      <div className="project-card__thumb">
        {project.thumbnail ? (
          <img src={fileUrl(project.thumbnail)} alt="" loading="lazy" />
        ) : (
          <span className="project-card__placeholder">{project.title}</span>
        )}
      </div>
      <div className="project-card__body">
        {project.category && <p className="eyebrow">{project.category}</p>}
        <h3 className="project-card__title">{project.title}</h3>
        {project.summary && <p className="project-card__summary">{project.summary}</p>}
        <span className="text-link">
          {texts.project_link_label} <Arrow />
        </span>
      </div>
    </M>
  )
}
