import { Link } from 'react-router-dom'
import { fileUrl, resumeUrl } from '../api/client'
import CtaBanner from '../components/CtaBanner'
import { Arrow, RichText, twoDigits } from '../components/ui'
import E, { M } from '../components/Editable'
import { useShown, useSite, useSiteNav } from '../context/SiteContext'
import NotFound from './NotFound'

function PracticeArt({ teaching }) {
  return (
    <svg className="practice__art" viewBox="0 0 150 56" fill="none" aria-hidden="true">
      <path
        d="M8 34c0-12 8-22 18-22s14 9 14 20-6 18-13 18-9-8-4-17 14-17 24-17"
        stroke="currentColor"
        strokeWidth="1.500"
        strokeLinecap="round"
      />
      <path d="M58 28h24" stroke="currentColor" strokeWidth="1.500" strokeLinecap="round" strokeDasharray="2 5" />
      {teaching ? (
        <>
          <path d="M96 42l20-14 22-18" stroke="currentColor" strokeWidth="1.500" strokeLinecap="round" />
          <circle cx="96" cy="42" r="4" fill="currentColor" />
          <circle cx="116" cy="28" r="4" fill="currentColor" />
          <circle cx="138" cy="10" r="4" fill="currentColor" />
        </>
      ) : (
        <>
          <rect x="94" y="6" width="48" height="44" rx="5" stroke="currentColor" strokeWidth="1.500" />
          <path d="M102 18h32" stroke="currentColor" strokeWidth="1.500" strokeLinecap="round" />
          <rect x="102" y="30" width="22" height="10" rx="3" fill="currentColor" />
        </>
      )}
    </svg>
  )
}

export default function About() {
  const { profile, texts, sections } = useSite()
  const { base, username } = useSiteNav()
  const shown = useShown()
  if (!shown('page.about')) return <NotFound />
  const photo = profile.about_image || profile.hero_image

  return (
    <>
      <section className="section section--top">
        <div className="container page-head page-head--photo">
          <div>
            <E k="about_eyebrow" as="p" className="eyebrow" />
            <E k="about_title" as="h1" className="h1" rich />
            <E k="about_intro" as="p" className="lead" />
            <div className="actions">
              <M k="about_contact" as={Link} to={`${base}/contact`} className="btn btn--primary">Work with me <Arrow /></M>
              {profile.linkedin_url && (
                <M k="about_linkedin" as="a" href={profile.linkedin_url} target="_blank" rel="noreferrer" className="btn btn--outline">LinkedIn profile</M>
              )}
              {shown('about.resume') && profile.has_resume && (
                <M k="about_resume" as="a" href={resumeUrl(username)} className="btn btn--outline" download>Download resume</M>
              )}
            </div>
          </div>
          <M k="about_photo" className="portrait portrait--about" hidden={!shown('about.photo')}>
            {photo ? (
              <img src={fileUrl(photo)} alt={profile.name} />
            ) : (
              <div className="portrait__placeholder" aria-hidden="true">
                {profile.name.charAt(0)}
              </div>
            )}
          </M>
        </div>
      </section>

      {shown('about.practices') && sections.practices.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <E k="practices_title" as="h2" className="h2" rich />
            <div className="practice-grid">
              {sections.practices.map((practice, index) => (
                <M k={`item_${practice.id}`} as="article" className={`practice ${index % 2 ? 'practice--dark' : ''}`} key={practice.id}>
                  <PracticeArt teaching={index % 2 === 1} />
                  <E item={practice} field="title" as="h3" />
                  <E item={practice} field="body" as="p" />
                </M>
              ))}
            </div>
          </div>
        </section>
      )}

      {shown('about.experience') && sections.experience.length > 0 && (
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
      )}

      {shown('about.principles') && sections.principles.length > 0 && (
        <section className="section">
          <div className="container">
            <E k="principles_title" as="h2" className="h2" />
            <ol className="step-grid step-grid--four">
              {sections.principles.map((principle, index) => (
                <M k={`item_${principle.id}`} as="li" className="step step--tinted" key={principle.id}>
                  <span className="step__number">{twoDigits(index + 1)}</span>
                  <E item={principle} field="title" as="h3" className="step__title step__title--serif" />
                  <E item={principle} field="body" as="p" />
                </M>
              ))}
            </ol>
          </div>
        </section>
      )}

      {shown('about.skills') && sections.skills.length > 0 && (
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
      )}

      {shown('about.cta') && <CtaBanner />}
    </>
  )
}
