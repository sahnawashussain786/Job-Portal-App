import { useEffect } from 'react'

const SUFFIX = 'JobNest'

/** Set the document title for a page, restoring nothing on unmount (each page sets its own). */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : `${SUFFIX} — Find your next role`
  }, [title])
}

export default useDocumentTitle
