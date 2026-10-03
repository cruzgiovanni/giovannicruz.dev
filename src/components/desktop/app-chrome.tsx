'use client'

import { createContext, useContext } from 'react'
import type { StaticImageData } from 'next/image'

export type MenuEntry =
  | { label: string; shortcut?: string; checked?: boolean; disabled?: boolean; onSelect: () => void }
  | 'separator'

export interface AppMenu {
  title: string
  items: MenuEntry[]
}

/** What an app shows while its window is in front: its name and icon, its menus, and the window's title. */
export interface AppChrome {
  name: string
  icon: StaticImageData
  title: string
  menus: AppMenu[]
}

interface Desktop {
  /** Publishes (or, with null, withdraws) the chrome of the app in a window. */
  publish: (windowId: string, chrome: AppChrome | null) => void
}

const DesktopContext = createContext<Desktop | null>(null)

export const DesktopProvider = DesktopContext

/** The desktop the app runs in; null outside CruzTosh. */
export function useDesktop() {
  return useContext(DesktopContext)
}
