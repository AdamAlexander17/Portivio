import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// One portfolio's profile, page copy and section lists, shared by the pages below the provider.
//   load         fetches the site data (a visitor's view, or the one being managed in the panel)
//   username     whose portfolio the public pages show; empty for the primary site
//   previewable  true for the public site: when it is shown inside the panel's Design Studio,
//                it accepts unsaved design changes from the Studio and draws them live
const SiteContext = createContext(null)

// The design settings the Studio may override in a preview. Nothing else is accepted.
const PREVIEW_FIELDS = ['theme', 'layout', 'layout_options', 'typography', 'home_sections', 'settings', 'text_styles']
export const PREVIEW_MESSAGE = 'pf:preview'
export const PREVIEW_READY = 'pf:preview-ready'
// Sent by the site to the Visual editor: a text was clicked / a text was retyped.
export const EDIT_SELECT = 'pf:edit-select'
export const EDIT_TEXT = 'pf:edit-text'
// ...something was dragged to a new place / a home section was dragged to a new position.
export const EDIT_STYLE = 'pf:edit-style'
export const EDIT_SECTIONS = 'pf:edit-sections'

function usePreviewDraft(enabled) {
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    // Only when embedded in a page of this same site (the Studio's preview frame).
    if (!enabled || window.parent === window) return undefined
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (event.data?.type === PREVIEW_MESSAGE) setDraft(event.data.draft || null)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [enabled])

  return draft
}

export function SiteProvider({ load, username = '', previewable = false, children }) {
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const draft = usePreviewDraft(previewable)

  const reload = useCallback(async () => {
    try {
      setSaved(await load())
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [load])

  useEffect(() => {
    reload()
  }, [reload])

  // The saved site with any previewed design changes laid on top.
  const site = useMemo(() => {
    if (!saved || !draft) return saved
    const merged = { ...saved }
    for (const field of PREVIEW_FIELDS) if (draft[field]) merged[field] = draft[field]
    // Unsaved wording from the Visual editor: page texts, and fields of list entries by id.
    if (draft.texts) merged.texts = { ...saved.texts, ...draft.texts }
    if (draft.items) {
      merged.sections = Object.fromEntries(
        Object.entries(saved.sections).map(([name, rows]) => [
          name,
          rows.map((row) => (draft.items[row.id] ? { ...row, ...draft.items[row.id] } : row)),
        ]),
      )
    }
    return merged
  }, [saved, draft])

  // Set while the site is open in the Visual editor: texts can be clicked and typed over.
  const editOn = Boolean(draft?.edit)
  const editSelected = draft?.selected || null
  const edit = useMemo(() => (editOn ? { selected: editSelected } : null), [editOn, editSelected])

  useEffect(() => {
    if (previewable && site?.profile?.name) document.title = `${site.profile.name} | Portfolio`
  }, [site, previewable])

  // Every public link starts with this, so a user's pages stay under /u/<username>.
  const base = username ? `/u/${username}` : ''

  return <SiteContext.Provider value={{ site, error, reload, base, username, edit }}>{children}</SiteContext.Provider>
}

export function useSiteState() {
  return useContext(SiteContext)
}

// For public pages, which only render once the site data has loaded.
export function useSite() {
  return useContext(SiteContext).site
}

// null on the live site; { selected } inside the Visual editor's frame.
export function useEditMode() {
  return useContext(SiteContext).edit
}

// The link prefix and username of the portfolio being viewed.
export function useSiteNav() {
  const { base, username } = useContext(SiteContext)
  return { base, username }
}

// Tells whether a page or page part is switched on for this site: shown('hero.photo').
// The keys are listed in src/visibility.js.
export function useShown() {
  const hidden = useContext(SiteContext).site?.settings?.hidden
  return useCallback((key) => !(hidden || []).includes(key), [hidden])
}

// Where a managed portfolio lives on the public site.
// Every portfolio, the admin's included, is at /u/<username>; the root address is the product's landing page.
export const publicBase = (owner) => (owner ? `/u/${owner.username}` : '')
