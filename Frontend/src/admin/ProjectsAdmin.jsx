import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fileUrl } from '../api/client'
import { publicBase, useSiteState } from '../context/SiteContext'
import { ProjectDetailsForm } from './ProjectForm'
import { Feedback, Icon, Modal, MoveButtons, moved, PageHeader, useAction, useConfirm } from './adminUi'

export default function ProjectsAdmin() {
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()
  const [projects, setProjects] = useState(null)
  // Opens straight away when arriving from a "new project" link (?new=1).
  const [adding, setAdding] = useState(() => new URLSearchParams(window.location.search).has('new'))
  const siteBase = publicBase(useSiteState().site?.owner)

  useEffect(() => {
    run(() => api.adminProjects()).then((list) => list && setProjects(list))
  }, [run])

  async function remove(project) {
    if (!(await confirm(`Delete "${project.title}" and all of its images? This cannot be undone.`))) return
    run(async () => {
      await api.deleteProject(project.id)
      setProjects(await api.adminProjects())
    }, 'Project deleted.')
  }

  function move(index, step) {
    const next = moved(projects, index, step)
    if (next === projects) return
    setProjects(next)
    run(() => api.reorderProjects(next.map((project) => project.id)))
  }

  return (
    <>
      <PageHeader title="Projects" intro="The order here is the order on the site. The featured project shows large at the top of the Projects page.">
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setAdding(true)}>
          <Icon name="plus" /> Add project
        </button>
      </PageHeader>
      <Feedback error={error} notice={notice} />

      {adding && (
        <Modal title="New project" size="large" onClose={() => setAdding(false)}>
          <p className="adm-muted">Start with the basics. After creating it you can add gallery images and a case study.</p>
          <ProjectDetailsForm project={null} onCancel={() => setAdding(false)} />
        </Modal>
      )}

      {projects && projects.length === 0 && <p className="adm-card adm-muted">No projects yet. Add your first one.</p>}

      {projects && projects.length > 0 && (
        <ul className="adm-list">
          {projects.map((project, index) => (
            <li className="adm-card adm-list__item" key={project.id}>
              <MoveButtons index={index} count={projects.length} disabled={busy} onMove={(step) => move(index, step)} />
              <div className="adm-thumb">{project.thumbnail ? <img src={fileUrl(project.thumbnail)} alt="" /> : <span>No image</span>}</div>
              <div className="adm-list__text">
                <strong>{project.title}</strong>
                <p className="adm-muted">{project.category}</p>
                <p>
                  {project.is_featured && <span className="adm-badge adm-badge--purple">Featured</span>}
                  {project.is_published ? <span className="adm-badge adm-badge--good">Published</span> : <span className="adm-badge adm-badge--warn">Hidden</span>}
                </p>
              </div>
              <div className="adm-row">
                <Link to={`/admin/projects/${project.id}`} className="adm-btn">
                  <Icon name="edit" /> Edit
                </Link>
                {project.is_published && (
                  <a href={`${siteBase}/projects/${project.slug}`} target="_blank" rel="noreferrer" className="adm-btn">
                    <Icon name="external" /> View
                  </a>
                )}
                <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={() => remove(project)}>
                  <Icon name="trash" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
