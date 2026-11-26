import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Feedback, Icon, PageHeader, useAction, useConfirm } from './adminUi'

const formatDate = (value) =>
  new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function Messages() {
  const { busy, error, notice, run } = useAction()
  const confirm = useConfirm()
  const [messages, setMessages] = useState(null)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    run(() => api.messages()).then((list) => list && setMessages(list))
  }, [run])

  const replace = (updated) => setMessages((list) => list.map((m) => (m.id === updated.id ? updated : m)))

  async function setRead(message, isRead) {
    const updated = await run(() => api.markMessage(message.id, isRead))
    if (updated) replace(updated)
  }

  function toggle(message) {
    const opening = openId !== message.id
    setOpenId(opening ? message.id : null)
    if (opening && !message.is_read) setRead(message, true)
  }

  async function remove(message) {
    if (!(await confirm(`Delete the message from ${message.name}?`))) return
    run(async () => {
      await api.deleteMessage(message.id)
      setMessages((list) => list.filter((m) => m.id !== message.id))
    }, 'Message deleted.')
  }

  return (
    <>
      <PageHeader title="Messages" intro="Everything sent through the contact form." />
      <Feedback error={error} notice={notice} />

      {messages && messages.length === 0 && <p className="adm-card adm-muted">No messages yet.</p>}

      {messages && messages.length > 0 && (
        <ul className="adm-list">
          {messages.map((message) => {
            const open = openId === message.id
            return (
              <li className={`adm-card adm-message ${message.is_read ? '' : 'is-unread'}`} key={message.id}>
                <button type="button" className="adm-message__head" aria-expanded={open} onClick={() => toggle(message)}>
                  <span>
                    <strong>{message.name}</strong>
                    {!message.is_read && <span className="adm-badge adm-badge--purple">New</span>}
                    {message.topic && <span className="adm-badge">{message.topic}</span>}
                  </span>
                  <span className="adm-muted">{formatDate(message.created_at)}</span>
                </button>

                {open && (
                  <div className="adm-message__body">
                    <dl>
                      <div>
                        <dt>Email</dt>
                        <dd>{message.email}</dd>
                      </div>
                      {message.company && (
                        <div>
                          <dt>Company</dt>
                          <dd>{message.company}</dd>
                        </div>
                      )}
                      {message.budget && (
                        <div>
                          <dt>Budget</dt>
                          <dd>{message.budget}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="adm-message__text">{message.message}</p>
                    <div className="adm-row">
                      <a className="adm-btn adm-btn--primary" href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.topic || 'Your message'}`)}`}>
                        <Icon name="mail" /> Reply by email
                      </a>
                      <button type="button" className="adm-btn" disabled={busy} onClick={() => setRead(message, !message.is_read)}>
                        Mark as {message.is_read ? 'unread' : 'read'}
                      </button>
                      <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={() => remove(message)}>
                        <Icon name="trash" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
