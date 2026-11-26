import ContactSection from '../components/ContactSection'
import { useShown } from '../context/SiteContext'
import NotFound from './NotFound'

export default function Contact() {
  const shown = useShown()
  if (!shown('page.contact')) return <NotFound />
  return (
    <div className="contact-page">
      <ContactSection as="h1" />
    </div>
  )
}
