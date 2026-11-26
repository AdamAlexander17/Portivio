import { useState } from 'react'
import { api } from '../api/client'
import { useFetch } from '../hooks'
import { Feedback, PageHeader } from './adminUi'

const RANGES = [
  [7, '7 days'],
  [30, '30 days'],
  [90, '90 days'],
]
const formatDay = (iso, options = { day: 'numeric', month: 'short' }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, options)
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

// A round top for the axis, at or just above the largest value, whose half is also a whole number.
function axisTop(max) {
  if (max <= 4) return 4
  const power = 10 ** Math.floor(Math.log10(max))
  return [1, 2, 3, 4, 5, 6, 8, 10].map((step) => step * power).find((top) => top >= max)
}

// Page views per day: one series, so the title names it and no legend is needed.
// Each column has a hover/focus tooltip; "Show table" gives the same numbers as text.
function ViewsChart({ daily }) {
  const [active, setActive] = useState(null)
  const top = axisTop(Math.max(...daily.map((day) => day.views)))
  const ticks = [top, top / 2, 0]
  const labelEvery = Math.ceil(daily.length / 6)
  const focus = active === null ? null : daily[active]

  return (
    <div className="chart">
      <div className="chart__plot">
        <div className="chart__axis" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="chart__bars" role="img" aria-label={`Page views per day for the last ${daily.length} days`} onMouseLeave={() => setActive(null)}>
          {daily.map((day, index) => (
            <button
              type="button"
              key={day.day}
              className={`chart__col ${active === index ? 'is-active' : ''}`}
              aria-label={`${formatDay(day.day)}: ${plural(day.views, 'view')}, ${plural(day.visitors, 'visitor')}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            >
              <span className="chart__bar" style={{ height: `${(day.views / top) * 100}%` }} />
            </button>
          ))}
          {focus && (
            <div className="chart__tip" style={{ left: `${((active + 0.5) / daily.length) * 100}%` }} role="status">
              <strong>{formatDay(focus.day, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
              <span>{plural(focus.views, 'view')}</span>
              <span>{plural(focus.visitors, 'visitor')}</span>
            </div>
          )}
        </div>
      </div>
      <div className="chart__days" aria-hidden="true">
        {daily.map((day, index) => (
          <span key={day.day}>{index % labelEvery === 0 ? formatDay(day.day) : ''}</span>
        ))}
      </div>
    </div>
  )
}

function Report({ data }) {
  const [asTable, setAsTable] = useState(false)
  const tiles = [
    ['Page views', data.views],
    ['Visitors', data.visitors],
    ['Project views', data.project_views],
    ['Resume downloads', data.resume_downloads],
    ['Messages', data.messages],
  ]

  return (
    <>
      <div className="adm-tiles">
        {tiles.map(([label, value]) => (
          <div className="adm-card adm-tile" key={label}>
            <span>{label}</span>
            <strong>{value.toLocaleString()}</strong>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <div className="adm-row adm-row--between">
          <h2>Page views per day</h2>
          <button type="button" className="adm-btn adm-btn--small" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>
            {asTable ? 'Show chart' : 'Show table'}
          </button>
        </div>
        {data.views === 0 ? (
          <p className="adm-muted">No visits in this period yet. Share your site link and they will show up here.</p>
        ) : asTable ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Views</th>
                  <th>Visitors</th>
                </tr>
              </thead>
              <tbody>
                {[...data.daily].reverse().map((day) => (
                  <tr key={day.day}>
                    <td>{formatDay(day.day, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td>{day.views}</td>
                    <td>{day.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ViewsChart daily={data.daily} />
        )}
      </div>

      <div className="adm-grid">
        <div className="adm-card">
          <h2>Most viewed projects</h2>
          {data.top_projects.length === 0 ? (
            <p className="adm-muted">No project has been opened in this period.</p>
          ) : (
            <ol className="adm-rank">
              {data.top_projects.map((project) => (
                <li key={project.slug}>
                  <span>{project.title}</span>
                  <strong>{project.views}</strong>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="adm-card">
          <h2>Most viewed pages</h2>
          {data.top_pages.length === 0 ? (
            <p className="adm-muted">No page views in this period.</p>
          ) : (
            <ol className="adm-rank">
              {data.top_pages.map((page) => (
                <li key={page.path}>
                  <span>{page.path}</span>
                  <strong>{page.views}</strong>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <p className="adm-muted">
        Counted without cookies and without storing IP addresses. Search-engine bots, the Design Studio preview and your own
        visits while signed in are not counted. A visitor is counted once per day.
      </p>
    </>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(30)
  const { data, error } = useFetch(() => api.analytics(days), [days])

  return (
    <>
      <PageHeader title="Analytics" intro="How many people visit your site and what they look at.">
        <div className="studio-tabs" role="group" aria-label="Period">
          {RANGES.map(([value, label]) => (
            <button type="button" key={value} aria-pressed={days === value} className={days === value ? 'is-active' : ''} onClick={() => setDays(value)}>
              {label}
            </button>
          ))}
        </div>
      </PageHeader>
      <Feedback error={error} />
      {data && <Report data={data} />}
    </>
  )
}
