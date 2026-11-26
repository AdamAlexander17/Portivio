import { api } from '../api/client'
import CtaBanner from '../components/CtaBanner'
import ProjectCard from '../components/ProjectCard'
import { RichText } from '../components/ui'
import E from '../components/Editable'
import { useShown, useSite, useSiteNav } from '../context/SiteContext'
import NotFound from './NotFound'
import { useFetch } from '../hooks'

export default function Projects() {
  const { texts } = useSite()
  const { username } = useSiteNav()
  const { data, loading, error } = useFetch(() => api.projects(username), [username])

  const shown = useShown()
  if (!shown('page.projects')) return <NotFound />

  const projects = data || []
  const featured = projects.find((project) => project.is_featured)
  const others = projects.filter((project) => project !== featured)

  return (
    <>
      <section className="section section--top">
        <div className="container">
          <E k="projects_eyebrow" as="p" className="eyebrow" />
          <E k="projects_title" as="h1" className="h1" rich />
          <E k="projects_intro" as="p" className="lead lead--narrow" />

          {loading && <p className="empty">Loading…</p>}
          {error && <p className="empty">{error}</p>}
          {!loading && !error && projects.length === 0 && <p className="empty">Work will appear here soon.</p>}

          {featured && (
            <div className="project-featured">
              <ProjectCard project={featured} featured />
            </div>
          )}
          {others.length > 0 && (
            <div className="project-grid">
              {others.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>
      {shown('projects.cta') && <CtaBanner />}
    </>
  )
}
