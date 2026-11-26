import { Link } from 'react-router-dom'
import { useShown, useSiteNav } from '../context/SiteContext'
import E, { M } from './Editable'

export default function CtaBanner() {
  const { base } = useSiteNav()
  const shown = useShown()
  return (
    <section className="section section--cta">
      <div className="container">
        <div className="cta">
          <E k="cta_title" as="h2" className="cta__title" rich />
          <div className="cta__actions">
            {shown('page.contact') && (
              <M k="cta_contact" as={Link} to={`${base}/contact`} className="btn btn--light">Start a conversation</M>
            )}
            {shown('page.projects') && (
              <M k="cta_projects" as={Link} to={`${base}/projects`} className="btn btn--outline-light">See the work</M>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
