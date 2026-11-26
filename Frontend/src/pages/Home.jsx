import { Link } from 'react-router-dom'
import { fileUrl, resumeUrl } from '../api/client'
import { Arrow, RichText } from '../components/ui'
import E, { M, SectionMover } from '../components/Editable'
import { useEditMode, useShown, useSite, useSiteNav } from '../context/SiteContext'
import { CustomBlock, HOME_BLOCKS } from './homeSections'

export default function Home() {
  const { profile, texts, home_sections: homeSections, custom_sections: customSections } = useSite()
  const { base, username } = useSiteNav()
  const shown = useShown()
  const withPhoto = shown('hero.photo')
  const editing = Boolean(useEditMode())

  return (
    <>
      {/* The hero always comes first; everything after it is arranged by the site's owner. */}
      <section className="hero">
        <div className={`container hero__grid ${withPhoto ? '' : 'hero__grid--solo'}`}>
          <div>
            {shown('hero.eyebrow') && <E k="hero_eyebrow" as="p" className="eyebrow" />}
            <E k="hero_title" as="h1" className="hero__title" rich />
            {shown('hero.intro') && <E k="hero_intro" as="p" className="lead" />}
            <div className="actions">
              {/* A button goes with its page: no work page, no "see my work" button. */}
              {shown('hero.primary') && shown('page.projects') && (
                <E k="hero_primary_button" as={Link} to={`${base}/projects`} className="btn btn--primary"><Arrow /></E>
              )}
              {shown('hero.secondary') && shown('page.contact') && (
                <E k="hero_secondary_button" as={Link} to={`${base}/contact`} className="btn btn--outline"><Arrow /></E>
              )}
              {shown('hero.resume') && profile.has_resume && (
                <M k="hero_resume" as="a" href={resumeUrl(username)} className="btn btn--outline" download>Download resume</M>
              )}
            </div>
            {shown('hero.stats') && <E k="hero_stats" as="p" className="hero__stats" />}
          </div>

          <M k="hero_photo" as="figure" className="portrait" hidden={!withPhoto}>
            {profile.hero_image ? (
              <img src={fileUrl(profile.hero_image)} alt={profile.name} />
            ) : (
              <div className="portrait__placeholder" aria-hidden="true">
                {profile.name.charAt(0)}
              </div>
            )}
            {shown('hero.caption') && texts.hero_caption && <E k="hero_caption" as="figcaption" />}
          </M>
        </div>
      </section>

      {(homeSections || [])
        .filter((section) => section.visible)
        .map((section) => {
          let block = null
          if (section.key.startsWith('custom:')) {
            const custom = (customSections || []).find((item) => `custom:${item.id}` === section.key)
            if (custom) block = <CustomBlock key={section.key} section={custom} />
          } else {
            const Block = HOME_BLOCKS[section.key]
            if (Block) block = <Block key={section.key} />
          }
          // In the Design Studio every section gets a handle to drag it up or down.
          if (!block || !editing) return block
          return (
            <SectionMover key={section.key} id={section.key} sections={homeSections}>
              {block}
            </SectionMover>
          )
        })}
    </>
  )
}
