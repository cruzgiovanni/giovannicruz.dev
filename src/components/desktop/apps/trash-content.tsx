'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/components/locale-provider'
import { localeTags, type Localized } from '@/lib/i18n'

interface TrashItem {
  name: string
  size?: string
  folder?: boolean
  deleted: string
}

const trashItems: TrashItem[] = [
  { name: 'old_resume_v1.doc', size: '24 KB', deleted: '2024-01-15' },
  { name: 'portfolio_raw_html_version', folder: true, deleted: '2024-03-08' },
  { name: 'screenshot_2024.png', size: '156 KB', deleted: '2024-02-22' },
  { name: 'notes_backup.txt', size: '2 KB', deleted: '2023-12-03' },
  { name: 'test_file.js', size: '1 KB', deleted: '2024-04-01' },
]

const TRASH_STORAGE_KEY = 'cruz-os-trash-items'

const copy = {
  en: {
    count: (n: number) => (n === 0 ? 'Trash is empty' : `${n} item${n !== 1 ? 's' : ''} in Trash`),
    emptying: 'Emptying...',
    emptyTrash: 'Empty Trash',
    name: 'Name',
    size: 'Size',
    dateDeleted: 'Date Deleted',
    folder: '-- folder',
    noItems: 'No items in Trash',
    emptied: 'Trash has been emptied',
    hint: 'Click "Empty Trash" to permanently delete all items',
  },
  pt: {
    count: (n: number) => (n === 0 ? 'O Lixo está vazio' : `${n} ${n === 1 ? 'item' : 'itens'} no Lixo`),
    emptying: 'Esvaziando...',
    emptyTrash: 'Esvaziar Lixo',
    name: 'Nome',
    size: 'Tamanho',
    dateDeleted: 'Data de exclusão',
    folder: '-- pasta',
    noItems: 'Nenhum item no Lixo',
    emptied: 'O Lixo foi esvaziado',
    hint: 'Clique em "Esvaziar Lixo" para apagar todos os itens de vez',
  },
}

// Numeric in Portuguese: the spelled-out month doesn't fit the column
const dateFormats: Localized<Intl.DateTimeFormatOptions> = {
  en: { month: 'short', day: 'numeric', year: 'numeric' },
  pt: { day: '2-digit', month: '2-digit', year: 'numeric' },
}

// Which items are left; older versions saved whole items, with their text in English
function readSavedNames(): string[] | null {
  try {
    const saved = JSON.parse(localStorage.getItem(TRASH_STORAGE_KEY) ?? 'null')
    if (!Array.isArray(saved)) return null
    return saved
      .map((entry) => (typeof entry === 'string' ? entry : entry?.name))
      .filter((name): name is string => typeof name === 'string')
  } catch {
    return null
  }
}

export function TrashContent() {
  const locale = useLocale()
  const t = copy[locale]
  const [items, setItems] = useState(trashItems)
  const [isEmptying, setIsEmptying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedNames = readSavedNames()
    if (savedNames !== null) {
      setItems(trashItems.filter((item) => savedNames.includes(item.name)))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items.map((item) => item.name)))
    }
  }, [items, isLoaded])

  // Dates are calendar days, so format them in UTC to keep the day from shifting
  const formatDate = (day: string) =>
    new Date(day).toLocaleDateString(localeTags[locale], { ...dateFormats[locale], timeZone: 'UTC' })

  const handleEmptyTrash = () => {
    if (items.length === 0) return

    setIsEmptying(true)

    const deleteInterval = setInterval(() => {
      setItems((prev) => {
        if (prev.length <= 1) {
          clearInterval(deleteInterval)
          setIsEmptying(false)
          return []
        }
        return prev.slice(0, -1)
      })
    }, 200)
  }

  return (
    <div className="h-full flex flex-col bg-white font-mono text-[11px] md:text-[12px]">
      {/* Header */}
      <div
        className="px-3 py-2 border-b border-[#888888] shrink-0 flex items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #dddddd 100%)',
        }}
      >
        <p className="text-black font-bold">{t.count(items.length)}</p>
        <button
          onClick={handleEmptyTrash}
          disabled={items.length === 0 || isEmptying}
          className="px-3 py-1 text-[10px] md:text-[11px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:brightness-90 text-black/90"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)',
            border: '1px solid #000000',
            boxShadow: 'inset -1px -1px 0 #888888, inset 1px 1px 0 #ffffff',
          }}
        >
          {isEmptying ? t.emptying : t.emptyTrash}
        </button>
      </div>

      {/* File list header */}
      <div
        className="grid grid-cols-[1fr_80px_100px] px-3 py-1 border-b border-[#aaaaaa] text-[10px] text-[#666666] shrink-0"
        style={{
          background: '#eeeeee',
        }}
      >
        <span>{t.name}</span>
        <span>{t.size}</span>
        <span>{t.dateDeleted}</span>
      </div>

      {/* File list - scrollable area using main tag */}
      <main
        className="flex-1 min-h-0"
        style={{
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#888888]">
            <span className="text-[32px] mb-2">🗑️</span>
            <p>{t.noItems}</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_80px_100px] px-3 py-1.5 border-b border-[#dddddd] hover:bg-[#e8e8ff] cursor-default"
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px]">{item.folder ? '📁' : '📄'}</span>
                <span className="text-black truncate">{item.name}</span>
              </div>
              <span className="text-[#666666]">{item.folder ? t.folder : item.size}</span>
              <span className="text-[#666666]">{formatDate(item.deleted)}</span>
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <div
        className="px-3 py-2 border-t border-[#888888] text-[10px] text-[#666666] shrink-0"
        style={{
          background: 'linear-gradient(180deg, #eeeeee 0%, #dddddd 100%)',
        }}
      >
        <p>{items.length === 0 ? t.emptied : t.hint}</p>
      </div>
    </div>
  )
}
