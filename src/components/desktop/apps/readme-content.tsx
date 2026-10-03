'use client'

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import Image, { type StaticImageData } from 'next/image'
import {
  RichTextEditor,
  defaultLabels,
  type BlockType,
  type RichTextEditorHandle,
  type RichTextEditorLabels,
} from '@/components/arc/rich-text-editor/rich-text-editor'
import { useDesktop, type AppMenu } from '@/components/desktop/app-chrome'
import { useLocale } from '@/components/locale-provider'
import { getReadmeFiles } from '@/data/readme'
import type { Locale, Localized } from '@/lib/i18n'
import art from '../../../../public/art.jpeg'
import me from '../../../../public/me.jpeg'
import readmeIcon from '../../../../public/mac-icons/readme.png'
import styles from './readme-content.module.css'

type View = 'formatted' | 'markdown'
type Mark = 'bold' | 'italic' | 'strike' | 'code'

const VIEWS: View[] = ['formatted', 'markdown']

const MONO = 'var(--font-geist-mono), ui-monospace, monospace'

const copy = {
  en: {
    app: 'ReadMe',
    files: 'Files',
    views: { formatted: 'Formatted', markdown: 'Markdown' },
    words: (n: number) => `${n} ${n === 1 ? 'word' : 'words'}`,
    edited: 'Edited, not saved',
    untitled: 'untitled',
    placeholder: 'Start writing',
    blockHint: 'Type / for blocks',
    mobileTip: 'Tip: Visit on a computer for the full retro Macintosh (Cruztosh) experience!',
    menus: {
      file: 'File',
      edit: 'Edit',
      format: 'Format',
      view: 'View',
      newFile: 'New File',
      save: 'Save',
      revert: 'Revert',
      restore: 'Restore Original',
      delete: 'Delete File',
      undo: 'Undo',
      redo: 'Redo',
      focus: 'Focus Mode',
    },
  },
  pt: {
    app: 'Leia-me',
    files: 'Arquivos',
    views: { formatted: 'Formatado', markdown: 'Markdown' },
    words: (n: number) => `${n} ${n === 1 ? 'palavra' : 'palavras'}`,
    edited: 'Editado, não salvo',
    untitled: 'sem-titulo',
    placeholder: 'Comece a escrever',
    blockHint: 'Digite / para blocos',
    mobileTip: 'Dica: acesse pelo computador para a experiência completa do Macintosh retrô (Cruztosh)!',
    menus: {
      file: 'Arquivo',
      edit: 'Editar',
      format: 'Formatar',
      view: 'Visualizar',
      newFile: 'Novo arquivo',
      save: 'Salvar',
      revert: 'Reverter',
      restore: 'Restaurar original',
      delete: 'Apagar arquivo',
      undo: 'Desfazer',
      redo: 'Refazer',
      focus: 'Modo foco',
    },
  },
}

const editorLabels: Localized<RichTextEditorLabels> = {
  en: defaultLabels,
  pt: {
    blocks: {
      p: 'Texto',
      h1: 'Título 1',
      h2: 'Título 2',
      h3: 'Título 3',
      ul: 'Lista',
      ol: 'Lista numerada',
      blockquote: 'Citação',
      pre: 'Bloco de código',
      hr: 'Divisória',
    },
    blocksMenu: 'Blocos',
    formatting: 'Formatação',
    bold: 'Negrito',
    italic: 'Itálico',
    strikethrough: 'Tachado',
    inlineCode: 'Código',
    link: 'Link',
    editLink: 'Editar link',
    backToFormatting: 'Voltar à formatação',
    linkPlaceholder: 'Cole ou digite um link',
    linkAddress: 'Endereço do link',
    removeLink: 'Remover link',
    applyLink: 'Aplicar link',
    undone: 'Desfeito',
    redone: 'Refeito',
    formatted: 'Formatado',
    linkAdded: 'Link adicionado',
    linkRemoved: 'Link removido',
    blockAdded: (block) => `Bloco adicionado: ${block}`,
  },
}

interface Figure {
  image: StaticImageData
  alt: string
  path: string
}

// Pictures pinned to the top of a file. The editor drops images from what it edits, so they sit above it:
// shown as pictures in the formatted view and as Markdown in the source view, but never editable.
const FIGURES: Partial<Record<string, Figure[]>> = {
  home: [{ image: art, alt: 'Logo', path: '/art.jpeg' }],
  about: [{ image: me, alt: 'Giovanni Cruz', path: '/me.jpeg' }],
}

/** A file in the ReadMe. Edits stay in `current` until saved; saving keeps them in this browser. */
interface Doc {
  id: string
  name: string
  /** The portfolio's text; empty for files made here */
  original: string
  saved: string
  current: string
  created: boolean
  /** Whether it's kept in this browser yet (new files are, from their first save) */
  stored: boolean
  /** Bumped when the text is replaced from outside the editor (revert, restore), so it reloads */
  revision: number
}

interface Stored {
  saved: Record<string, string>
  created: { id: string; name: string }[]
}

const storageKey = (locale: Locale) => `cruztosh-readme-${locale}`

function readStored(locale: Locale): Stored {
  const stored: Stored = { saved: {}, created: [] }
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(locale)) ?? 'null')
    if (value?.saved && typeof value.saved === 'object') {
      for (const [id, text] of Object.entries(value.saved)) if (typeof text === 'string') stored.saved[id] = text
    }
    if (Array.isArray(value?.created)) {
      for (const file of value.created) {
        if (typeof file?.id === 'string' && typeof file?.name === 'string') stored.created.push({ id: file.id, name: file.name })
      }
    }
  } catch {
    // Unreadable or unavailable storage: start from the portfolio's files
  }
  return stored
}

// What saving keeps, as stored; null when nothing differs from the portfolio
function serializeStored(docs: Doc[]) {
  const kept = docs.filter((doc) => (doc.created ? doc.stored : doc.saved !== doc.original))
  if (!kept.length) return null
  return JSON.stringify({
    saved: Object.fromEntries(kept.map((doc) => [doc.id, doc.saved])),
    created: kept.filter((doc) => doc.created).map(({ id, name }) => ({ id, name })),
  } satisfies Stored)
}

function writeStored(locale: Locale, serialized: string | null) {
  try {
    if (serialized === null) localStorage.removeItem(storageKey(locale))
    else localStorage.setItem(storageKey(locale), serialized)
  } catch {
    // Storage full or blocked: saving still works for this visit
  }
}

function loadDocs(locale: Locale): Doc[] {
  const stored = readStored(locale)
  const docs: Doc[] = getReadmeFiles(locale).map((file) => {
    const saved = stored.saved[file.id] ?? file.markdown
    return { id: file.id, name: file.name, original: file.markdown, saved, current: saved, created: false, stored: true, revision: 0 }
  })
  for (const file of stored.created) {
    const saved = stored.saved[file.id] ?? ''
    docs.push({ id: file.id, name: file.name, original: '', saved, current: saved, created: true, stored: true, revision: 0 })
  }
  return docs
}

// Words a reader would count: link text without its address, no Markdown syntax
const countWords = (markdown: string) =>
  markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, ' ')
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length

type EditHandler = (markdown: string) => void

function DocumentIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3 shrink-0" aria-hidden="true">
      <path d="M3 1 L3 15 L13 15 L13 4 L10 1 Z" fill="#ffffff" stroke="#000" strokeWidth="1" />
      <path d="M10 1 L10 4 L13 4" fill="#cccccc" stroke="#000" strokeWidth="1" />
    </svg>
  )
}

function Figures({ figures }: { figures: Figure[] }) {
  return (
    <div className={`mb-9 flex gap-3 ${styles.figures}`} onContextMenu={(event) => event.preventDefault()}>
      {figures.map((figure) => (
        <div key={figure.path} className="border border-[#cccccc] bg-[#f5f5f5] p-1">
          <Image
            src={figure.image}
            alt={figure.alt}
            width={112}
            height={112}
            draggable={false}
            // The ReadMe opens on boot, so these are the largest things on screen (LCP)
            loading="eager"
            className="size-24 select-none object-cover md:size-28"
          />
        </div>
      ))}
    </div>
  )
}

// The child of `parent` that `node` is in (or is)
function childHolding(parent: Node, node: Node) {
  let child: Node | null = node
  while (child && child.parentNode !== parent) child = child.parentNode
  return child
}

/** What focus mode keeps lit for the caret: the top-level block it's in, plus the item when that block is a list. */
function focusedBlocks(editor: HTMLElement, selection: Selection | null): Element[] | null {
  let node = selection?.focusNode ?? null
  // A caret between blocks sits on the editor itself
  if (node === editor) node = editor.childNodes[Math.min(selection!.focusOffset, editor.childNodes.length - 1)] ?? null
  if (!node || node === editor || !editor.contains(node)) return null
  const block = childHolding(editor, node)
  if (block?.nodeType !== Node.ELEMENT_NODE) return null
  const item = /^(UL|OL)$/.test(block.nodeName) ? childHolding(block, node) : null
  return item?.nodeName === 'LI' ? [block as Element, item as Element] : [block as Element]
}

function FormattedDocument({
  name,
  markdown,
  figures,
  focus,
  editorRef,
  onEdit,
}: {
  name: string
  markdown: string
  figures?: Figure[]
  focus: boolean
  editorRef: RefObject<RichTextEditorHandle | null>
  onEdit: EditHandler
}) {
  const locale = useLocale()
  const t = copy[locale]
  const rootRef = useRef<HTMLDivElement>(null)
  // The editor's first change is it reporting what it loaded (normalized), not an edit. Changes that
  // come back to it hand back the text as it was given, so the file reads as unchanged again.
  const loaded = useRef<string | null>(null)
  const given = useRef(markdown)

  // Focus mode: everything but the block holding the caret fades back, as in iA Writer. The document and the
  // block in focus are marked in the DOM (the editor keeps such marks out of its history and output); the CSS dims the rest.
  useEffect(() => {
    const root = rootRef.current
    const editor = root?.querySelector<HTMLElement>('[role="textbox"]')
    if (!focus || !root || !editor) return

    const show = (blocks: Element[]) => {
      editor.querySelectorAll('[data-focus]').forEach((block) => {
        if (!blocks.includes(block)) block.removeAttribute('data-focus')
      })
      blocks.forEach((block) => block.setAttribute('data-focus', ''))
      root.toggleAttribute('data-focusing', blocks.length > 0)
    }
    // Follows the caret. While it's outside the document (in the menu bar, say), the block it left stays in focus.
    const follow = () =>
      show(focusedBlocks(editor, window.getSelection()) ?? Array.from(editor.querySelectorAll('[data-focus]')))

    // Turned on with no caret in the document: one goes to the start of the first block in view, so it shows at once
    if (!focusedBlocks(editor, window.getSelection())) {
      const top = root.closest('main')?.getBoundingClientRect().top ?? 0
      const block = Array.from(editor.children).find(
        (child) => child.nodeName !== 'HR' && child.getBoundingClientRect().bottom > top,
      )
      if (block) {
        const target = /^(UL|OL)$/.test(block.nodeName) ? (block.querySelector('li') ?? block) : block
        const text = document.createTreeWalker(target, NodeFilter.SHOW_TEXT).nextNode()
        editor.focus({ preventScroll: true })
        window.getSelection()?.collapse(text ?? target, 0)
      }
    }
    follow()

    // The editor rebuilds blocks as it goes (a new line, a heading, an undo); the new ones come in already marked
    const observer = new MutationObserver(follow)
    observer.observe(editor, { childList: true, subtree: true })
    document.addEventListener('selectionchange', follow)
    return () => {
      document.removeEventListener('selectionchange', follow)
      observer.disconnect()
      show([])
    }
  }, [focus])

  return (
    <div ref={rootRef}>
      {figures && <Figures figures={figures} />}
      <RichTextEditor
        ref={editorRef}
        defaultMarkdown={markdown}
        onChange={({ markdown: next }) => {
          if (loaded.current === null) {
            loaded.current = next
            return
          }
          onEdit(next === loaded.current ? given.current : next)
        }}
        labels={editorLabels[locale]}
        placeholder={t.placeholder}
        blockHint={t.blockHint}
        aria-label={name}
      />
    </div>
  )
}

function MarkdownDocument({ name, markdown, onEdit }: { name: string; markdown: string; onEdit: EditHandler }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Grows with its content, so the page scrolls rather than the field
  const fit = () => {
    const field = ref.current
    if (!field) return
    const scroller = field.closest('main')
    const scrollTop = scroller?.scrollTop ?? 0
    field.style.height = 'auto'
    field.style.height = `${field.scrollHeight}px`
    if (scroller) scroller.scrollTop = scrollTop
  }

  useLayoutEffect(fit, [markdown])

  // Rewrapping at a new width changes the height too
  useLayoutEffect(() => {
    const field = ref.current
    if (!field) return
    let width = field.clientWidth
    const observer = new ResizeObserver(() => {
      if (field.clientWidth === width) return
      width = field.clientWidth
      fit()
    })
    observer.observe(field)
    return () => observer.disconnect()
  }, [])

  return (
    <textarea
      ref={ref}
      value={markdown}
      onChange={(event) => onEdit(event.target.value)}
      rows={1}
      spellCheck={false}
      aria-label={name}
      className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[13px] leading-[1.75] text-[#1a1a1a] outline-none"
      style={{ fontFamily: MONO }}
    />
  )
}

export function ReadmeContent() {
  const locale = useLocale()
  const t = copy[locale]
  const labels = editorLabels[locale]
  const desktop = useDesktop()
  const editorRef = useRef<RichTextEditorHandle | null>(null)

  const [docs, setDocs] = useState(() => loadDocs(locale))
  const [activeId, setActiveId] = useState(() => docs[0].id)
  const [view, setView] = useState<View>('formatted')
  const [focus, setFocus] = useState(false)

  const active = docs.find((doc) => doc.id === activeId) ?? docs[0]
  const figures = FIGURES[active.id]
  const dirty = active.current !== active.saved
  const saveable = dirty || !active.stored
  const restorable = !active.created && (active.saved !== active.original || active.current !== active.original)
  const activeCreated = active.created

  // What's saved lives in this browser; typing alone doesn't touch it
  const stored = serializeStored(docs)
  useEffect(() => writeStored(locale, stored), [locale, stored])

  const update = (id: string, change: (doc: Doc) => Doc) =>
    setDocs((current) => current.map((doc) => (doc.id === id ? change(doc) : doc)))

  const edit: EditHandler = (next) => {
    const id = active.id
    update(id, (doc) => (doc.current === next ? doc : { ...doc, current: next }))
  }

  // Commands, for the menu bar and shortcuts
  const save = () => {
    if (saveable) update(active.id, (doc) => ({ ...doc, saved: doc.current, stored: true }))
  }
  const revert = () => update(active.id, (doc) => ({ ...doc, current: doc.saved, revision: doc.revision + 1 }))
  const restore = () =>
    update(active.id, (doc) => ({ ...doc, saved: doc.original, current: doc.original, revision: doc.revision + 1 }))
  const create = () => {
    let name = `${t.untitled}.md`
    for (let n = 2; docs.some((doc) => doc.name === name); n++) name = `${t.untitled}-${n}.md`
    const id = `new-${Date.now().toString(36)}`
    setDocs((current) => [
      ...current,
      { id, name, original: '', saved: '', current: '', created: true, stored: false, revision: 0 },
    ])
    setActiveId(id)
  }
  const remove = () => {
    const index = docs.findIndex((doc) => doc.id === active.id)
    setDocs((current) => current.filter((doc) => doc.id !== active.id))
    setActiveId((docs[index - 1] ?? docs[index + 1]).id)
  }
  // Marks and blocks act on the editor's own selection, never on text outside it
  const inEditor = () => {
    const anchor = window.getSelection()?.anchorNode
    return !!anchor && !!editorRef.current?.element?.contains(anchor)
  }
  const format = (mark: Mark) => {
    if (inEditor()) editorRef.current?.format(mark)
  }
  const setBlock = (type: BlockType) => {
    if (inEditor()) editorRef.current?.setBlock(type)
  }
  const undo = () => (view === 'formatted' ? editorRef.current?.undo() : document.execCommand('undo'))
  const redo = () => (view === 'formatted' ? editorRef.current?.redo() : document.execCommand('redo'))

  const commands = useRef({ save, revert, restore, create, remove, format, setBlock, undo, redo })
  useLayoutEffect(() => {
    commands.current = { save, revert, restore, create, remove, format, setBlock, undo, redo }
  })

  // While this window is in front, the menu bar is the ReadMe's and the window is titled after the open file
  const title = `${t.app} — ${active.name}${dirty ? ' •' : ''}`
  const formatted = view === 'formatted'
  useEffect(() => {
    if (!desktop) return
    const run = (command: 'save' | 'revert' | 'restore' | 'create' | 'remove' | 'undo' | 'redo') => () => {
      commands.current[command]()
    }
    const menus: AppMenu[] = [
      {
        title: t.menus.file,
        items: [
          { label: t.menus.newFile, onSelect: run('create') },
          'separator',
          { label: t.menus.save, shortcut: '⌘S', disabled: !saveable, onSelect: run('save') },
          { label: t.menus.revert, disabled: !dirty, onSelect: run('revert') },
          activeCreated
            ? { label: t.menus.delete, onSelect: run('remove') }
            : { label: t.menus.restore, disabled: !restorable, onSelect: run('restore') },
        ],
      },
      {
        title: t.menus.edit,
        items: [
          { label: t.menus.undo, shortcut: '⌘Z', onSelect: run('undo') },
          { label: t.menus.redo, shortcut: '⇧⌘Z', onSelect: run('redo') },
        ],
      },
      {
        title: t.menus.format,
        items: [
          { label: labels.bold, shortcut: '⌘B', disabled: !formatted, onSelect: () => commands.current.format('bold') },
          { label: labels.italic, shortcut: '⌘I', disabled: !formatted, onSelect: () => commands.current.format('italic') },
          {
            label: labels.strikethrough,
            shortcut: '⇧⌘X',
            disabled: !formatted,
            onSelect: () => commands.current.format('strike'),
          },
          { label: labels.inlineCode, shortcut: '⌘E', disabled: !formatted, onSelect: () => commands.current.format('code') },
          'separator',
          { label: labels.blocks.h1, disabled: !formatted, onSelect: () => commands.current.setBlock('h1') },
          { label: labels.blocks.h2, disabled: !formatted, onSelect: () => commands.current.setBlock('h2') },
          { label: labels.blocks.blockquote, disabled: !formatted, onSelect: () => commands.current.setBlock('blockquote') },
        ],
      },
      {
        title: t.menus.view,
        items: [
          ...VIEWS.map((option) => ({ label: t.views[option], checked: view === option, onSelect: () => setView(option) })),
          'separator' as const,
          { label: t.menus.focus, checked: focus, disabled: !formatted, onSelect: () => setFocus((on) => !on) },
        ],
      },
    ]
    desktop.publish('readme', { name: t.app, icon: readmeIcon, title, menus })
  }, [desktop, t, labels, title, saveable, dirty, restorable, activeCreated, view, formatted, focus])

  useEffect(() => () => desktop?.publish('readme', null), [desktop])

  // ⌘S saves the open file, instead of the browser saving the page
  const onKeyDown = (event: React.KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault()
      save()
    }
  }

  // Links in the formatted view open on a plain click, as long as it isn't the end of a text selection
  const openLink = (event: React.MouseEvent) => {
    const link = (event.target as Element).closest('a[href]')
    if (!link || !window.getSelection()?.isCollapsed) return
    event.preventDefault()
    const href = link.getAttribute('href') ?? ''
    if (href.startsWith('mailto:')) window.location.href = href
    else window.open(href, '_blank', 'noopener,noreferrer')
  }

  // Esc that closed one of the editor's menus shouldn't also close the window
  const keepHandledEscape = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && event.defaultPrevented) event.stopPropagation()
  }

  return (
    <div className="flex h-full flex-col bg-white md:flex-row" onKeyDown={onKeyDown}>
      {/* Files: a sidebar like a text editor's, a strip on phones */}
      <nav
        aria-label={t.files}
        className="shrink-0 border-b border-black bg-[#eeeeee] md:w-[168px] md:border-b-0 md:border-r"
      >
        <p
          className="hidden px-3 pb-1.5 pt-3 text-[10px] uppercase tracking-[0.08em] text-[#777777] md:block"
          style={{ fontFamily: MONO }}
        >
          {t.files}
        </p>
        <div
          role="tablist"
          className="flex gap-px overflow-x-auto p-1.5 [scrollbar-width:none] md:flex-col md:overflow-visible md:pt-0"
        >
          {docs.map((doc) => {
            const selected = doc.id === active.id
            return (
              <button
                key={doc.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(doc.id)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 px-2 py-[5px] text-left text-[11px] leading-none whitespace-nowrap md:w-full ${
                  selected ? 'bg-[#000080] text-white' : 'text-black hover:bg-[#dddddd]'
                }`}
                style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
              >
                <DocumentIcon />
                <span className="truncate">{doc.name}</span>
                {doc.current !== doc.saved && (
                  <span className="ml-auto pl-1" title={t.edited} aria-label={t.edited}>
                    •
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <p className="shrink-0 border-b border-[#e0d890] bg-[#fffef0] px-3 py-1.5 text-[11px] italic text-[#666655] md:hidden">
          {t.mobileTip}
        </p>

        {/* The document: a centered column with room around it */}
        <main
          className={`min-h-0 flex-1 overflow-y-auto ${styles.document}`}
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          <div
            role="tabpanel"
            aria-label={active.name}
            className="mx-auto w-full max-w-[580px] px-6 pb-16 pt-10 md:px-10"
            onClick={openLink}
            onKeyDown={keepHandledEscape}
          >
            {formatted ? (
              <FormattedDocument
                key={`${active.id}:${active.revision}`}
                name={active.name}
                markdown={active.current}
                figures={figures}
                focus={focus}
                editorRef={editorRef}
                onEdit={edit}
              />
            ) : (
              <>
                {figures && (
                  <p
                    className="mb-[1.75em] select-none text-[13px] leading-[1.75] text-[#8a8a8a]"
                    style={{ fontFamily: MONO }}
                  >
                    {figures.map((figure) => `![${figure.alt}](${figure.path})`).join(' ')}
                  </p>
                )}
                <MarkdownDocument
                  key={`${active.id}:${active.revision}`}
                  name={active.name}
                  markdown={active.current}
                  onEdit={edit}
                />
              </>
            )}
          </div>
        </main>

        {/* Status bar */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-3 py-1 text-[10px] text-[#555555]"
          style={{
            background: 'linear-gradient(180deg, #eeeeee 0%, #dddddd 100%)',
            borderTop: '1px solid #888888',
            fontFamily: MONO,
          }}
        >
          <span className="truncate">
            {active.name} · Markdown · {t.words(countWords(active.current))}
          </span>
          <div className="flex shrink-0">
            {VIEWS.map((option, index) => {
              const pressed = view === option
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setView(option)}
                  className="cursor-pointer px-2 py-px text-[10px] text-black"
                  style={{
                    marginLeft: index > 0 ? -1 : 0,
                    border: '1px solid #000000',
                    background: pressed ? '#bbbbbb' : 'linear-gradient(180deg, #ffffff 0%, #cccccc 100%)',
                    boxShadow: pressed
                      ? 'inset 1px 1px 0 #888888'
                      : 'inset -1px -1px 0 #888888, inset 1px 1px 0 #ffffff',
                  }}
                >
                  {t.views[option]}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
