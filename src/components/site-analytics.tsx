'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// CruzTosh also runs framed inside the home page; only the top-level page counts as a visit
function topWindowOnly<T>(event: T): T | null {
  return window.self === window.top ? event : null
}

export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={topWindowOnly} />
      <SpeedInsights beforeSend={topWindowOnly} />
    </>
  )
}
