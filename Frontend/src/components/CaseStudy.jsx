import { fileUrl } from '../api/client'
import { Paragraphs } from './ui'

// Only these two players are ever embedded, and only from the video id the server
// extracted and checked, never from the address the author pasted.
const PLAYERS = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${id}`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}`,
}
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/

function Block({ block }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="case__heading">{block.text}</h2>
    case 'text':
      return <Paragraphs text={block.text} className="case__text" />
    case 'quote':
      return (
        <figure className="case__quote">
          <blockquote>{block.text}</blockquote>
          {block.by && <figcaption>{block.by}</figcaption>}
        </figure>
      )
    case 'image':
      return (
        <figure className="case__image">
          <img src={fileUrl(block.image)} alt={block.caption || ''} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
    case 'video': {
      const player = PLAYERS[block.provider]
      if (!player || !VIDEO_ID.test(block.video_id || '')) return null
      return (
        <div className="case__video">
          <iframe
            src={player(block.video_id)}
            title="Project video"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          />
        </div>
      )
    }
    default:
      return null
  }
}

// A project's case study: an ordered list of typed blocks written in the panel.
export default function CaseStudy({ blocks }) {
  if (!blocks?.length) return null
  return (
    <section className="section section--lav">
      <div className="container">
        <div className="case">
          <p className="eyebrow">Case study</p>
          {blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>
      </div>
    </section>
  )
}
