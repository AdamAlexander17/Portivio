import { useState } from 'react'
import { Link } from 'react-router-dom'
import CtaBanner from '../components/CtaBanner'
import { RichText } from '../components/ui'
import E, { M } from '../components/Editable'
import { useShown, useSite, useSiteNav } from '../context/SiteContext'
import NotFound from './NotFound'

const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

function Illustration() {
  return (
    <svg className="services-art" viewBox="0 0 320 260" fill="none" aria-hidden="true">
      <circle cx="170" cy="130" r="112" fill="#e9defa" />
      <rect x="62" y="58" width="176" height="128" rx="12" fill="#fff" stroke="#3a2a4d" strokeWidth="2" />
      <path d="M62 82h176" stroke="#3a2a4d" strokeWidth="2" />
      <circle cx="76" cy="70" r="3" fill="#6d3aa6" />
      <circle cx="87" cy="70" r="3" fill="#c9b3e6" />
      <rect x="78" y="98" width="62" height="42" rx="6" fill="#f6d77a" stroke="#3a2a4d" strokeWidth="2" />
      <rect x="152" y="98" width="70" height="8" rx="4" fill="#c9b3e6" />
      <rect x="152" y="114" width="52" height="8" rx="4" fill="#e3d6f4" />
      <rect x="152" y="130" width="62" height="8" rx="4" fill="#e3d6f4" />
      <rect x="78" y="152" width="144" height="18" rx="9" fill="#6d3aa6" />
      <rect x="212" y="120" width="62" height="104" rx="12" fill="#fff" stroke="#3a2a4d" strokeWidth="2" />
      <rect x="224" y="136" width="38" height="26" rx="5" fill="#e3d6f4" />
      <rect x="224" y="172" width="38" height="7" rx="3.500" fill="#c9b3e6" />
      <rect x="224" y="186" width="26" height="7" rx="3.500" fill="#e3d6f4" />
      <path d="M268 44l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" fill="#6d3aa6" />
    </svg>
  )
}

export function Faq({ item, open, onToggle }) {
  return (
    <div className={`faq ${open ? 'is-open' : ''}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`faq-${item.id}`} onClick={onToggle}>
          <E item={item} field="title" as="span" />
          <span className="faq__icon" aria-hidden="true" />
        </button>
      </h3>
      <div id={`faq-${item.id}`} className="faq__answer" hidden={!open}>
        <E item={item} field="body" as="p" />
      </div>
    </div>
  )
}

export default function Services() {
  const { texts, sections } = useSite()
  const { base } = useSiteNav()
  const [openFaq, setOpenFaq] = useState(sections.faqs[0]?.id ?? null)
  const shown = useShown()
  if (!shown('page.services')) return <NotFound />

  return (
    <>
      <section className="section section--top">
        <div className="container page-head">
          <div>
            <E k="services_eyebrow" as="p" className="eyebrow" />
            <E k="services_title" as="h1" className="h1" rich />
            <E k="services_intro" as="p" className="lead" />
            <div className="actions">
              <button type="button" className="chip chip--choice" onClick={() => jumpTo('offer')}>
                What I offer
              </button>
              <button type="button" className="chip chip--choice" onClick={() => jumpTo('industries')}>
                Industries
              </button>
              <button type="button" className="chip chip--choice" onClick={() => jumpTo('faq')}>
                FAQ
              </button>
            </div>
          </div>
          <Illustration />
        </div>
      </section>

      <section className="section section--tight" id="offer" hidden={!shown('services.offer')}>
        <div className="container">
          <E k="offer_title" as="h2" className="h2" />
          <div className="service-grid">
            {sections.services.map((service) => (
              <M k={`item_${service.id}`} as="article" className="service" key={service.id}>
                <E item={service} field="title" as="h3" className="service__title" />
                <E item={service} field="body" as="p" />
                {service.items.length > 0 && (
                  <>
                    <E k="services_list_label" as="p" className="service__label" />
                    <ul className="dash-list">
                      {service.items.map((deliverable) => (
                        <li key={deliverable}>{deliverable}</li>
                      ))}
                    </ul>
                  </>
                )}
                <Link to={`${base}/contact?topic=Design%20project`} className="btn btn--outline btn--small">
                  {service.meta ? <E item={service} field="meta" /> : 'Discuss this service'}
                </Link>
              </M>
            ))}
          </div>
        </div>
      </section>

      {shown('services.industries') && sections.industries.length > 0 && (
        <section className="section section--lav" id="industries">
          <div className="container">
            <E k="industries_title" as="h2" className="h2" />
            <E k="industries_intro" as="p" className="lead lead--narrow" />
            <div className="tile-grid">
              {sections.industries.map((industry) => (
                <M k={`item_${industry.id}`} as="article" className="tile" key={industry.id}>
                  <E item={industry} field="title" as="h3" />
                  <E item={industry} field="body" as="p" />
                </M>
              ))}
            </div>
          </div>
        </section>
      )}

      {shown('services.faq') && sections.faqs.length > 0 && (
        <section className="section" id="faq">
          <div className="container">
            <E k="faq_title" as="h2" className="h2" />
            <div className="faq-list">
              {sections.faqs.map((item) => (
                <Faq
                  key={item.id}
                  item={item}
                  open={openFaq === item.id}
                  onToggle={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {shown('services.cta') && <CtaBanner />}
    </>
  )
}
