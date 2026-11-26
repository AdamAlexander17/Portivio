import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ---- Icons -------------------------------------------------------------------
// Line icons on a 24px grid, used inside buttons: <Icon name="plus" /> Add
const ICON_PATHS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  bold: 'M7 5h6a3.500 3.500 0 0 1 0 7H7zM7 12h7a3.500 3.500 0 0 1 0 7H7z',
  italic: 'M10 5h7M7 19h7M14 5l-4 14',
  underline: 'M7 4v7a5 5 0 0 0 10 0V4M5 20h14',
  alignLeft: 'M4 6h16M4 10h10M4 14h16M4 18h10',
  alignCenter: 'M4 6h16M7 10h10M4 14h16M7 18h10',
  alignRight: 'M4 6h16M10 10h10M4 14h16M10 18h10',
  eraser: 'M8 19l-4.500-4.500a1.500 1.500 0 0 1 0-2.100l8.400-8.400a1.500 1.500 0 0 1 2.100 0l5 5a1.500 1.500 0 0 1 0 2.100L11 19zM8 19h12M9 8l7 7',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3',
  check: 'M5 12.500l4.500 4.500L19 7.500',
  close: 'M6 6l12 12M18 6L6 18',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  upload: 'M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  lock: 'M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM8 11V8a4 4 0 0 1 8 0v3',
  key: 'M15 7a4 4 0 1 1-3.900 4.900L4 19v2h3v-2h2v-2h2l1.500-1.500A4 4 0 0 1 15 7zM16 9h.010',
  enter: 'M10 4h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-8M4 12h10M11 8l4 4-4 4',
  undo: 'M4 8h10a5 5 0 0 1 0 10H8M4 8l4-4M4 8l4 4',
  ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.600 5.600l12.800 12.800',
  mail: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0 1l8 6 8-6',
  copy: 'M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.500 2.700 3.800 5.700 3.800 9s-1.300 6.300-3.800 9c-2.500-2.700-3.800-5.700-3.800-9S9.500 5.700 12 3z',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M13.500 5l-3 14',
  camera: 'M4 8h3l1.500-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  pen: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  chart: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  briefcase: 'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zm5 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
  megaphone: 'M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  star: 'M12 4l2.500 5.100 5.600.800-4 4 .900 5.600L12 16.900 6.900 19.500l1-5.600-4-4 5.600-.800z',
  layout: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 10h18M9 10v9',
  alert: 'M12 9v4M12 17h.010M10.300 4.300L2.800 17.500A2 2 0 0 0 4.500 20.500h15a2 2 0 0 0 1.700-3L13.700 4.300a2 2 0 0 0-3.400 0z',
}

export function Icon({ name, size = 16 }) {
  return (
    <svg className="adm-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

// ---- Popups ------------------------------------------------------------------
// A dialog over the page, used for every add / edit form and for confirmations.
// Closes with the X, the Escape key or a click outside; `error` shows inside it.
export function Modal({ title, onClose, size = 'medium', error, children }) {
  const panel = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Start inside the dialog, unless a field in it already took the focus.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="adm-modal" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`adm-modal__panel adm-modal__panel--${size}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}>
        <header className="adm-modal__head">
          <h2>{title}</h2>
          <button type="button" className="adm-modal__close" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="adm-modal__body">
          {error && (
            <p className="adm-alert adm-alert--error" role="alert">
              {error}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

// "Are you sure?" as a proper dialog instead of the browser's own box:
//   const confirm = useConfirm()
//   if (!(await confirm('Delete this image?'))) return
// Pass a string, or { title, message, confirmLabel, danger }.
const ConfirmContext = createContext(async () => false)
export const useConfirm = () => useContext(ConfirmContext)

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)

  const confirm = useCallback((options) => {
    const given = typeof options === 'string' ? { message: options } : options
    const destructive = /^(delete|remove|block)/i.test(given.message || '')
    const verb = (given.message || '').match(/^(delete|remove|block)/i)?.[0]
    return new Promise((resolve) =>
      setRequest({
        title: given.title || (destructive ? 'Are you sure?' : 'Please confirm'),
        confirmLabel: given.confirmLabel || (verb ? verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase() : 'Confirm'),
        danger: given.danger ?? destructive,
        message: given.message,
        resolve,
      }),
    )
  }, [])

  const answer = (value) => {
    request.resolve(value)
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal title={request.title} size="small" onClose={() => answer(false)}>
          <div className="adm-confirm">
            {request.danger && (
              <span className="adm-confirm__icon">
                <Icon name="alert" size={22} />
              </span>
            )}
            <p>{request.message}</p>
          </div>
          <div className="adm-modal__actions">
            <button type="button" className="adm-btn" onClick={() => answer(false)}>
              Cancel
            </button>
            <button type="button" className={`adm-btn ${request.danger ? 'adm-btn--danger-solid' : 'adm-btn--primary'}`} autoFocus onClick={() => answer(true)}>
              {request.danger && <Icon name="trash" />} {request.confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

// Wraps an API call with busy / error / success state for a form or button.
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const run = useCallback(async (action, successMessage = '') => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await action()
      setNotice(successMessage)
      return result
    } catch (err) {
      setError(err.message)
      return undefined
    } finally {
      setBusy(false)
    }
  }, [])

  return { busy, error, notice, run, setNotice }
}

export function Feedback({ error, notice }) {
  if (error) {
    return (
      <p className="adm-alert adm-alert--error" role="alert">
        {error}
      </p>
    )
  }
  if (notice) {
    return (
      <p className="adm-alert adm-alert--ok" role="status">
        {notice}
      </p>
    )
  }
  return null
}

export function Field({ label, hint, children }) {
  return (
    <label className="adm-field">
      <span className="adm-field__label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

// The panel has one header per screen: the title with its intro line on the left,
// "View site" and the page's own buttons on the right. The header itself is drawn by
// AdminLayout; a page fills it in:
//   usePageTitle('Projects', 'The order here is the order on the site.')
//   <HeaderActions><button>Add project</button></HeaderActions>
// or both at once with <PageHeader title intro>…buttons…</PageHeader>.
const HeaderContext = createContext({ setHeader: () => {}, actionsNode: null })
export const TitleProvider = HeaderContext.Provider

export function usePageTitle(title, intro = '') {
  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader({ title: title || '', intro: intro || '' })
  }, [setHeader, title, intro])
}

// Places its children (a page's main buttons) in the header, beside "View site".
export function HeaderActions({ children }) {
  const { actionsNode } = useContext(HeaderContext)
  return actionsNode ? createPortal(children, actionsNode) : null
}

export function PageHeader({ title, intro, children }) {
  usePageTitle(title, intro)
  return children ? <HeaderActions>{children}</HeaderActions> : null
}

// Returns a new array with the item at `index` moved one place up (-1) or down (+1).
export function moved(list, index, step) {
  const target = index + step
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

export function MoveButtons({ index, count, onMove, disabled }) {
  return (
    <span className="adm-move">
      <button type="button" aria-label="Move up" disabled={disabled || index === 0} onClick={() => onMove(-1)}>
        <Icon name="up" />
      </button>
      <button type="button" aria-label="Move down" disabled={disabled || index === count - 1} onClick={() => onMove(1)}>
        <Icon name="down" />
      </button>
    </span>
  )
}

// One text line per entry <-> list of strings.
export const linesToList = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean)
export const listToLines = (list) => (list || []).join('\n')
