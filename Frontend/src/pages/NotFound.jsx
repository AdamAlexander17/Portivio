import { Link } from 'react-router-dom'
import { useSiteNav } from '../context/SiteContext'

export default function NotFound() {
  const { base } = useSiteNav()
  return (
    <section className="section section--top">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className="h1">Page not found</h1>
        <p className="lead">The page you are looking for does not exist.</p>
        <Link to={base || '/'} className="btn btn--primary">
          Back to home
        </Link>
      </div>
    </section>
  )
}
