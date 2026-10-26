'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useDesktop } from '@/components/desktop/app-chrome'
import { useLocale } from '@/components/locale-provider'
import { siteConfig } from '@/data/config'
import { getInfo, SHOW_PROJECTS } from '@/data/info'
import { getReadmeFiles } from '@/data/readme'
import { localeTags, localize, type Locale, type Localized, type Text } from '@/lib/i18n'
import { COFFEE, JESUS, SMOKE, TRAIN, cowsay } from './terminal-art'

// Catppuccin Mocha: Base background, Text for input, Subtext 1 for output, Overlay 2 for muted lines,
// Green and Blue for the prompt, Blue for links and command names, Mauve for headings, Red for errors,
// Rosewater for the caret
const RAINBOW = [
  '#f38ba8',
  '#fab387',
  '#f9e2af',
  '#a6e3a1',
  '#94e2d5',
  '#89dceb',
  '#74c7ec',
  '#89b4fa',
  '#b4befe',
  '#cba6f7',
  '#f5c2e7',
  '#f2cdcd',
]
// neofetch's color blocks, normal and bright
const SWATCHES = [
  ['#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89b4fa', '#cba6f7', '#f5c2e7'],
  ['#eba0ac', '#f5e0dc', '#f2cdcd', '#89dceb', '#74c7ec', '#b4befe', '#bac2de', '#cdd6f4'],
]

// What `open` knows, by the name you type, and the window it opens
const APPS: Record<string, string> = {
  readme: 'readme',
  music: 'music-player',
  pong: 'pong',
  calculator: 'calculator',
  trash: 'trash',
}

const FORTUNES: { quote: Text; author: Text }[] = [
  {
    quote: { en: 'Simplicity is prerequisite for reliability.', pt: 'Simplicidade é pré-requisito para confiabilidade.' },
    author: 'Edsger W. Dijkstra',
  },
  {
    quote: {
      en: 'Programs must be written for people to read, and only incidentally for machines to execute.',
      pt: 'Programas devem ser escritos para pessoas lerem e, só incidentalmente, para máquinas executarem.',
    },
    author: 'Abelson & Sussman, SICP',
  },
  {
    quote: { en: 'Premature optimization is the root of all evil.', pt: 'Otimização prematura é a raiz de todo o mal.' },
    author: 'Donald Knuth',
  },
  { quote: { en: 'Talk is cheap. Show me the code.', pt: 'Falar é fácil. Me mostre o código.' }, author: 'Linus Torvalds' },
  {
    quote: {
      en: 'There are only two hard things in Computer Science: cache invalidation and naming things.',
      pt: 'Só existem duas coisas difíceis em Ciência da Computação: invalidar cache e dar nome às coisas.',
    },
    author: 'Phil Karlton',
  },
  {
    quote: {
      en: 'The cheapest, fastest, and most reliable components are those that aren’t there.',
      pt: 'Os componentes mais baratos, rápidos e confiáveis são os que não existem.',
    },
    author: 'Gordon Bell',
  },
  {
    quote: { en: 'Make it work, make it right, make it fast.', pt: 'Faça funcionar, faça direito, faça rápido.' },
    author: 'Kent Beck',
  },
  {
    quote: {
      en: 'Unless the Lord builds the house, those who build it labor in vain.',
      pt: 'Se o Senhor não edificar a casa, em vão trabalham os que a edificam.',
    },
    author: { en: 'Psalm 127:1', pt: 'Salmo 127:1' },
  },
  {
    quote: {
      en: 'Whatever you do, work heartily, as for the Lord and not for men.',
      pt: 'E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens.',
    },
    author: { en: 'Colossians 3:23', pt: 'Colossenses 3:23' },
  },
  {
    quote: { en: 'Ora et labora. (Pray and work.)', pt: 'Ora et labora. (Reza e trabalha.)' },
    author: { en: 'Benedictine motto', pt: 'Lema beneditino' },
  },
  {
    quote: {
      en: 'The beautiful thing about learning is nobody can take it away from you.',
      pt: 'O bonito de aprender é que ninguém pode tirar isso de você.',
    },
    author: 'B.B. King',
  },
]

// WMO weather codes, as Open-Meteo reports them
const SKIES: { codes: number[]; label: Localized<string>; icon: string }[] = [
  { codes: [0], label: { en: 'clear sky', pt: 'céu limpo' }, icon: '☀️' },
  { codes: [1, 2], label: { en: 'partly cloudy', pt: 'parcialmente nublado' }, icon: '⛅' },
  { codes: [3], label: { en: 'overcast', pt: 'nublado' }, icon: '☁️' },
  { codes: [45, 48], label: { en: 'fog', pt: 'neblina' }, icon: '🌫️' },
  { codes: [51, 53, 55, 56, 57], label: { en: 'drizzle', pt: 'garoa' }, icon: '🌦️' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: { en: 'rain', pt: 'chuva' }, icon: '🌧️' },
  { codes: [71, 73, 75, 77, 85, 86], label: { en: 'snow (?!)', pt: 'neve (?!)' }, icon: '❄️' },
  { codes: [95, 96, 99], label: { en: 'thunderstorm', pt: 'tempestade' }, icon: '⛈️' },
]

// Commands stay in English, like a real shell; what they print follows the visitor's language
const copy = {
  en: {
    groups: { basics: 'Basics', fun: 'Just for fun' },
    commands: {
      help: 'Show this help message',
      about: 'About me',
      skills: 'List my skills',
      projects: 'Show my projects',
      contact: 'Contact information',
      ls: 'List the ReadMe files',
      cat: 'Print a file: cat about.md',
      open: 'Open an app: open pong',
      history: 'Show the commands you typed',
      clear: 'Clear terminal',
      exit: 'Close the terminal',
    },
    fun: {
      neofetch: 'System info, with style',
      fortune: 'A random quote',
      cowsay: 'A cow says it for you',
      lolcat: 'Rainbow anything: fortune | lolcat',
      weather: 'Live weather where I live',
      ping: 'Ping the server',
      hack: 'Hack the mainframe',
      coffee: 'Brew a coffee',
      whoami: 'Who am I?',
      date: 'Show current date',
      echo: 'Echo a message',
      love: 'Displays the love of Giovanni’s life.',
      shutdown: 'Turn the Cruztosh off',
    },
    tips: [
      'Shortcuts: ↑/↓ history · Tab completes · Ctrl+L clears',
      'Pipes work too: fortune | cowsay | lolcat',
      'Some commands are hidden. Explore.',
    ],
    welcome: "Type 'help' for available commands, or try 'neofetch'.",
    lastLogin: (date: string) => `Last login: ${date} on ttys000`,
    projects: 'Professional Experience & Projects:',
    projectHint: "Type 'project <number>' for details (e.g., 'project 01')",
    period: 'Period',
    tech: 'Tech',
    type: 'Type',
    experience: 'Professional Experience',
    personal: 'Personal Project',
    projectNotFound: (num: string) => `Project '${num}' not found. Type 'projects' to see available projects.`,
    commandNotFound: (command: string, guess?: string) =>
      guess
        ? `command not found: ${command}. Did you mean '${guess}'?`
        : `command not found: ${command}. Type 'help' for available commands.`,
    pipeError: "syntax error near unexpected token '|'",
    date: () => new Date().toString(),
    duration: (minutes: number) =>
      minutes < 1 ? 'less than a minute' : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`,
    catUsage: "usage: cat <file>. Type 'ls' to see the files.",
    noFile: (name: string) => `cat: ${name}: No such file or directory`,
    secret: 'There’s no secret. Just faith, consistency and a lot of coffee.',
    openUsage: (apps: string) => `usage: open <app>\napps: ${apps}`,
    noApp: (name: string, apps: string) => `open: no app named '${name}'. Try: ${apps}`,
    alreadyHere: 'You’re already here. 🙂',
    exit: 'logout\n\n[Process completed]',
    shutdown: 'Broadcast message from guest@cruz-os:\n\nThe system is going down for poweroff NOW!',
    reboot: 'Broadcast message from guest@cruz-os:\n\nThe system is going down for reboot NOW!',
    moo: 'Moo.',
    lolcatUsage: 'usage: lolcat <text>, or pipe into it: fortune | lolcat',
    pong: "pong! 🏓 Up for a match? Type 'open pong'.",
    hack: {
      connecting: 'Connecting to the mainframe...',
      steps: ['Bypassing firewall', 'Decrypting secrets', 'Downloading more RAM'],
      granted: 'Access granted.',
      kidding: 'Just kidding. Nothing was hacked. Go drink some water. 💧',
    },
    coffee: 'HTTP 418: I’m a teapot. Here’s a coffee anyway.',
    weather: {
      loading: 'Looking at the sky...',
      error: 'weather: couldn’t reach the sky. Try again in a bit.',
      unknown: 'something the sky hasn’t named yet',
    },
    neofetch: {
      os: 'OS',
      host: 'Host',
      kernel: 'Kernel',
      uptime: 'Uptime',
      shell: 'Shell',
      theme: 'Theme',
      font: 'Font',
      music: 'Music',
      role: 'Role',
      stack: 'Stack',
      faith: 'faith',
      blues: 'old blues from the 70s',
    },
    uptime: (duration: string) => `up ${duration}, 1 user (you)`,
    sudoUsage: 'usage: sudo <command>',
    sudo: '[sudo] password for guest:\nguest is not in the sudoers file. This incident will be reported.',
    sandwich: 'Okay. 🥪',
    makeSandwich: 'What? Make it yourself.',
    make: 'make: *** No targets specified and no makefile found.  Stop.',
    rm: (target: string) => `rm: ${target ? `${target}: ` : ''}Permission denied. Nice try. 😉`,
    vim: 'Lucky you: there’s no vim here. You’d never get out. (Hint: :q!)',
    editor: (name: string) => `${name}: no editors here. Try 'open readme': it edits Markdown.`,
    quit: 'You’re not in vim. But nice reflexes.',
    cd: 'There’s no place like ~ 🏠',
    hello: "Hey there! 👋 Type 'help' to see what I can do.",
    sl: "Choo choo! 🚂 Did you mean 'ls'?",
  },
  pt: {
    groups: { basics: 'Básico', fun: 'Só por diversão' },
    commands: {
      help: 'Mostra esta ajuda',
      about: 'Sobre mim',
      skills: 'Lista minhas habilidades',
      projects: 'Mostra meus projetos',
      contact: 'Informações de contato',
      ls: 'Lista os arquivos do Leia-me',
      cat: 'Mostra um arquivo: cat sobre.md',
      open: 'Abre um app: open pong',
      history: 'Mostra os comandos que você digitou',
      clear: 'Limpa o terminal',
      exit: 'Fecha o terminal',
    },
    fun: {
      neofetch: 'Informações do sistema, com estilo',
      fortune: 'Uma frase aleatória',
      cowsay: 'Uma vaca fala por você',
      lolcat: 'Arco-íris em tudo: fortune | lolcat',
      weather: 'O tempo agora onde eu moro',
      ping: 'Pinga o servidor',
      hack: 'Hackeia o mainframe',
      coffee: 'Passa um café',
      whoami: 'Quem sou eu?',
      date: 'Mostra a data atual',
      echo: 'Repete uma mensagem',
      love: 'Mostra o amor da vida do Giovanni.',
      shutdown: 'Desliga o Cruztosh',
    },
    tips: [
      'Atalhos: ↑/↓ histórico · Tab completa · Ctrl+L limpa',
      'Pipes também funcionam: fortune | cowsay | lolcat',
      'Alguns comandos estão escondidos. Explore.',
    ],
    welcome: "Digite 'help' para ver os comandos disponíveis, ou experimente 'neofetch'.",
    lastLogin: (date: string) => `Último login: ${date} em ttys000`,
    projects: 'Experiência profissional e projetos:',
    projectHint: "Digite 'project <número>' para ver os detalhes (ex.: 'project 01')",
    period: 'Período',
    tech: 'Tecnologias',
    type: 'Tipo',
    experience: 'Experiência profissional',
    personal: 'Projeto pessoal',
    projectNotFound: (num: string) =>
      `Projeto '${num}' não encontrado. Digite 'projects' para ver os projetos disponíveis.`,
    commandNotFound: (command: string, guess?: string) =>
      guess
        ? `comando não encontrado: ${command}. Você quis dizer '${guess}'?`
        : `comando não encontrado: ${command}. Digite 'help' para ver os comandos disponíveis.`,
    pipeError: "erro de sintaxe próximo ao token inesperado '|'",
    date: () => new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'long' }),
    duration: (minutes: number) =>
      minutes < 1 ? 'menos de um minuto' : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`,
    catUsage: "uso: cat <arquivo>. Digite 'ls' para ver os arquivos.",
    noFile: (name: string) => `cat: ${name}: Arquivo ou diretório inexistente`,
    secret: 'Não tem segredo. Só fé, constância e muito café.',
    openUsage: (apps: string) => `uso: open <app>\napps: ${apps}`,
    noApp: (name: string, apps: string) => `open: nenhum app chamado '${name}'. Tente: ${apps}`,
    alreadyHere: 'Você já está aqui. 🙂',
    exit: 'logout\n\n[Processo concluído]',
    shutdown: 'Mensagem de guest@cruz-os para todos:\n\nO sistema será desligado AGORA!',
    reboot: 'Mensagem de guest@cruz-os para todos:\n\nO sistema será reiniciado AGORA!',
    moo: 'Muu.',
    lolcatUsage: 'uso: lolcat <texto>, ou use num pipe: fortune | lolcat',
    pong: "pong! 🏓 Bora uma partida? Digite 'open pong'.",
    hack: {
      connecting: 'Conectando ao mainframe...',
      steps: ['Burlando o firewall', 'Descriptografando segredos', 'Baixando mais memória RAM'],
      granted: 'Acesso concedido.',
      kidding: 'Brincadeira. Nada foi hackeado. Vai beber uma água. 💧',
    },
    coffee: 'HTTP 418: Eu sou um bule. Mas toma um café mesmo assim.',
    weather: {
      loading: 'Olhando pro céu...',
      error: 'weather: não deu pra ver o céu. Tente de novo daqui a pouco.',
      unknown: 'algo que o céu ainda não batizou',
    },
    neofetch: {
      os: 'SO',
      host: 'Host',
      kernel: 'Kernel',
      uptime: 'Ativo há',
      shell: 'Shell',
      theme: 'Tema',
      font: 'Fonte',
      music: 'Música',
      role: 'Cargo',
      stack: 'Stack',
      faith: 'fé',
      blues: 'blues antigo dos anos 70',
    },
    uptime: (duration: string) => `ativo há ${duration}, 1 usuário (você)`,
    sudoUsage: 'uso: sudo <comando>',
    sudo: '[sudo] senha para guest:\nguest não está no arquivo sudoers. Este incidente será reportado.',
    sandwich: 'Tá bom. 🥪',
    makeSandwich: 'Quê? Faz você mesmo.',
    make: 'make: *** Nenhum alvo indicado e nenhum makefile encontrado.  Pare.',
    rm: (target: string) => `rm: ${target ? `${target}: ` : ''}Permissão negada. Boa tentativa. 😉`,
    vim: 'Sorte sua: não tem vim aqui. Você nunca ia conseguir sair. (Dica: :q!)',
    editor: (name: string) => `${name}: não tem editor aqui. Tente 'open readme': ele edita Markdown.`,
    quit: 'Você não está no vim. Mas bons reflexos.',
    cd: 'Não há lugar como o ~ 🏠',
    hello: "Opa! 👋 Digite 'help' para ver o que eu sei fazer.",
    sl: "Piuí! 🚂 Você quis dizer 'ls'?",
  },
}

type Copy = (typeof copy)[Locale]

/** What a command printed to stderr: shown in red, and it stops a pipe. */
class Failure {
  constructor(readonly message: string) {}
}

const CLEAR = Symbol('clear')

// Text is stdout, so it can be piped into the next command; anything else is drawn as it is
type Output = ReactNode | Failure

/** A command, given what follows its name and what was piped into it (text only). */
type Command = (args: string, stdin: string | null) => Output | typeof CLEAR

interface HistoryEntry {
  id: number
  command: string
  output: Output
}

const LAST_LOGIN_KEY = 'cruz-os-terminal-last-login'

// When this browser last opened the Terminal
function readLastLogin() {
  try {
    const time = Number(localStorage.getItem(LAST_LOGIN_KEY))
    return time > 0 ? new Date(time) : null
  } catch {
    return null
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Typos between two words, for "did you mean": a letter added, dropped, changed, or swapped with the next one
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

function Prompt() {
  return (
    <span className="shrink-0 whitespace-nowrap">
      <span className="text-[#a6e3a1] hidden md:inline">guest@cruz-os</span>
      <span className="hidden md:inline">:</span>
      <span className="text-[#89b4fa]">~</span>
      <span>$&nbsp;</span>
    </span>
  )
}

function OutputView({ output }: { output: Output }) {
  if (output instanceof Failure) {
    return <pre className="text-[#f38ba8] whitespace-pre-wrap mt-1">{output.message}</pre>
  }
  if (typeof output === 'string') {
    return output ? <pre className="text-[#bac2de] whitespace-pre-wrap mt-1">{output}</pre> : null
  }
  if (output === null || output === undefined || typeof output === 'boolean') return null
  return <div className="text-[#bac2de] mt-1">{output}</div>
}

/** Lines that come in one at a time, like output from something slow. */
function Reveal({ lines, interval }: { lines: ReactNode[]; interval: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? lines.length : 1))

  useEffect(() => {
    if (shown >= lines.length) return
    const timer = setTimeout(() => setShown((count) => count + 1), interval)
    return () => clearTimeout(timer)
  }, [shown, lines.length, interval])

  return (
    <pre className="whitespace-pre-wrap">
      {lines.slice(0, shown).map((line, index) => (
        <Fragment key={index}>
          {index > 0 && '\n'}
          {line}
        </Fragment>
      ))}
    </pre>
  )
}

/** Text in a diagonal rainbow, as lolcat paints it. */
function Rainbow({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap">
      {text.split('\n').map((line, row) => {
        const chars = Array.from(line)
        return (
          <Fragment key={row}>
            {row > 0 && '\n'}
            {Array.from({ length: Math.ceil(chars.length / 2) }, (_, i) => (
              <span key={i} style={{ color: RAINBOW[(i + row) % RAINBOW.length] }}>
                {chars.slice(i * 2, i * 2 + 2).join('')}
              </span>
            ))}
          </Fragment>
        )
      })}
    </pre>
  )
}

const TRAIN_WIDTH = Math.max(...TRAIN.map((line) => line.length))

/** The train from sl, crossing the terminal from right to left. */
function Train({ done }: { done: string }) {
  const ref = useRef<HTMLPreElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  // Columns between the terminal's left edge and the train; null until measured, and when motion is reduced
  const [x, setX] = useState<number | null>(null)
  const [finished, setFinished] = useState(prefersReducedMotion)
  // Milliseconds per column: a wide terminal is crossed faster, so the trip takes about as long
  const step = useRef(40)

  // It sets off from just past the right edge (with motion reduced there's nothing to measure)
  useLayoutEffect(() => {
    const pre = ref.current
    const probe = probeRef.current
    if (!pre || !probe) return
    const columns = Math.ceil(pre.clientWidth / (probe.offsetWidth / 10))
    step.current = Math.min(40, Math.max(12, 3500 / (columns + TRAIN_WIDTH)))
    setX(columns)
  }, [])

  useEffect(() => {
    if (x === null) return
    if (x < -TRAIN_WIDTH) {
      setFinished(true)
      return
    }
    const timer = setTimeout(() => setX(x - 1), step.current)
    return () => clearTimeout(timer)
  }, [x])

  if (finished) {
    return (
      <pre className="whitespace-pre-wrap">
        {prefersReducedMotion() && `${[...SMOKE[0], ...TRAIN].join('\n')}\n\n`}
        <span className="text-[#9399b2]">{done}</span>
      </pre>
    )
  }
  const shift = (line: string) => (x === null ? '' : x >= 0 ? ' '.repeat(x) + line : line.slice(-x))
  const smoke = SMOKE[Math.floor(Math.abs(x ?? 0) / 4) % SMOKE.length]
  return (
    <pre ref={ref} className="relative overflow-hidden whitespace-pre">
      <span ref={probeRef} className="invisible absolute">
        0000000000
      </span>
      {[...smoke, ...TRAIN].map(shift).join('\n')}
    </pre>
  )
}

/** The current weather where I live, from Open-Meteo. */
function Weather({ t }: { t: Copy['weather'] }) {
  const locale = useLocale()
  const [sky, setSky] = useState<{ temperature: number; code: number } | 'loading' | 'error'>('loading')

  useEffect(() => {
    const controller = new AbortController()
    const { latitude, longitude } = siteConfig.coordinates
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
      { signal: controller.signal },
    )
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then(({ current }) => {
        if (typeof current?.temperature_2m !== 'number' || typeof current?.weather_code !== 'number') throw current
        setSky({ temperature: Math.round(current.temperature_2m), code: current.weather_code })
      })
      .catch(() => {
        if (!controller.signal.aborted) setSky('error')
      })
    return () => controller.abort()
  }, [])

  if (sky === 'loading') return <p className="text-[#9399b2]">{t.loading}</p>
  if (sky === 'error') return <p className="text-[#f38ba8]">{t.error}</p>
  const kind = SKIES.find((entry) => entry.codes.includes(sky.code))
  return (
    <p>
      {siteConfig.location[locale]}: <span className="text-[#fab387]">{sky.temperature}°C</span>,{' '}
      {kind ? `${kind.label[locale]} ${kind.icon}` : t.unknown}
    </p>
  )
}

export function TerminalContent() {
  const locale = useLocale()
  const t = copy[locale]
  const desktop = useDesktop()
  // The same content the ReadMe shows, so both stay in step with src/data
  const { hero, aboutSection, skillCategories, projects, contactSection } = getInfo(locale)
  const files = getReadmeFiles(locale)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [lastLogin] = useState(readLastLogin)
  const [startedAt] = useState(Date.now)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  // Commands typed, oldest first, and where ↑/↓ is in them, with the line that was being typed
  const log = useRef<string[]>([])
  const browsing = useRef<{ index: number; draft: string } | null>(null)

  // This visit is the last login the next one shows
  useEffect(() => {
    try {
      localStorage.setItem(LAST_LOGIN_KEY, String(Date.now()))
    } catch {
      // Storage blocked: every visit is the first
    }
  }, [])

  // Keep the newest line in view, also while output is still coming in (ping, hack, the weather)
  useEffect(() => {
    const terminal = terminalRef.current
    const content = contentRef.current
    if (!terminal || !content) return
    const observer = new ResizeObserver(() => {
      terminal.scrollTop = terminal.scrollHeight
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  const uptime = () => t.duration(Math.floor((Date.now() - startedAt) / 60000))
  const appNames = Object.keys(APPS)

  const help = () => (
    <>
      {[
        { title: t.groups.basics, entries: t.commands },
        { title: t.groups.fun, entries: t.fun },
      ].map((group) => (
        <div key={group.title} className="mb-2">
          <p className="text-[#cba6f7]">{group.title}</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 pl-2">
            {Object.entries(group.entries)
              .filter(([name]) => SHOW_PROJECTS || name !== 'projects')
              .map(([name, description]) => (
                <Fragment key={name}>
                  <span className="text-[#89b4fa]">{name}</span>
                  <span>{description}</span>
                </Fragment>
              ))}
          </div>
        </div>
      ))}
      {t.tips.map((tip) => (
        <p key={tip} className="text-[#9399b2]">
          {tip}
        </p>
      ))}
    </>
  )

  const contact = () => (
    <>
      <p>
        {contactSection.email.label}:{' '}
        <a
          href={`mailto:${contactSection.email.value}`}
          className="text-[#89b4fa] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {contactSection.email.value}
        </a>
      </p>
      <p>
        {contactSection.location.label}: {contactSection.location.value}
      </p>
      {contactSection.socials.map((social) => (
        <p key={social.name}>
          {social.name}:{' '}
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#89b4fa] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {social.url}
          </a>
        </p>
      ))}
    </>
  )

  const neofetch = () => {
    const n = t.neofetch
    const stack = [...new Set(skillCategories.flatMap((category) => category.technologies))].slice(0, 4)
    const rows = [
      [n.os, 'Cruz OS 9 (Cruztosh)'],
      [n.host, 'giovannicruz.dev'],
      [n.kernel, n.faith],
      [n.uptime, uptime()],
      [n.shell, 'cruzsh 2.0'],
      [n.theme, 'Catppuccin Mocha'],
      [n.font, 'Geist Mono'],
      [n.music, n.blues],
      [n.role, hero.badge],
      [n.stack, stack.join(', ')],
    ]
    return (
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {/* "Cruz" is Portuguese for cross: Cruz OS's logo */}
        <svg viewBox="0 0 6 9" className="w-[6em] shrink-0 self-start" fill="#f9e2af" aria-hidden="true">
          <rect x="2" width="2" height="9" />
          <rect y="2" width="6" height="2" />
        </svg>
        <div>
          <p>
            <span className="text-[#a6e3a1]">guest</span>@<span className="text-[#a6e3a1]">cruz-os</span>
          </p>
          <p className="text-[#9399b2]">-------------</p>
          {rows.map(([label, value]) => (
            <p key={label}>
              <span className="text-[#89b4fa]">{label}</span>: {value}
            </p>
          ))}
          <div className="mt-2 grid w-max grid-cols-8">
            {SWATCHES.flat().map((color) => (
              <span key={color} className="h-[1.25em] w-[3ch]" style={{ background: color }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const fortune = () => {
    const fortunes = [...FORTUNES, { quote: hero.paragraph, author: hero.name }]
    const { quote, author } = fortunes[Math.floor(Math.random() * fortunes.length)]
    return `"${localize(quote, locale)}"\n    — ${localize(author, locale)}`
  }

  const projectCommands: Record<string, Command> = SHOW_PROJECTS
    ? {
        projects: () => `${t.projects}

${projects.map((p) => `[${p.number}] ${p.title} - ${p.category} (${p.year})`).join('\n')}

${t.projectHint}`,
        project: (args) => {
          const num = args.trim()
          const project = projects.find((p) => p.number === num)
          if (!project) return new Failure(t.projectNotFound(num))
          const link = project.repo || project.demo || ''
          return `${project.title}
${project.category}
${t.period}: ${project.year}
${t.tech}: ${project.tech}
${t.type}: ${project.type === 'experience' ? t.experience : t.personal}
${link ? `Link: ${link}` : ''}`
        },
      }
    : {}

  const commands: Record<string, Command> = {
    help,
    about: () =>
      `${hero.name}
${hero.badge}

${aboutSection.paragraphs.map((paragraph) => paragraph.trim()).join('\n\n')}

${aboutSection.signature}

${aboutSection.stats.map((stat) => `${stat.value} ${stat.label}`).join('\n')}`,
    skills: () =>
      skillCategories.map((category) => (
        <p key={category.title}>
          <span style={{ color: category.color }}>{category.title}</span>: {category.technologies.join(', ')}
        </p>
      )),
    ...projectCommands,
    contact,
    // The ReadMe's files, as the portfolio wrote them; -a shows the one that isn't there
    ls: (args) =>
      [...(/(^|\s)-\w*a/.test(args) ? ['.', '..', '.secret'] : []), ...files.map((file) => file.name)].join('  '),
    cat: (args, stdin) => {
      const name = args.trim()
      if (!name) return stdin ?? new Failure(t.catUsage)
      if (name === '.secret') return t.secret
      const wanted = name.toLowerCase().replace(/\.md$/, '')
      const file = files.find((f) => f.id === wanted || f.name.replace(/\.md$/, '') === wanted)
      return file ? file.markdown : new Failure(t.noFile(name))
    },
    open: (args) => {
      const name = args.trim().toLowerCase()
      if (!name) return new Failure(t.openUsage(appNames.join(', ')))
      if (name === 'terminal') return t.alreadyHere
      if (!Object.hasOwn(APPS, name)) return new Failure(t.noApp(name, appNames.join(', ')))
      desktop?.open(APPS[name])
      return null
    },
    history: () => log.current.map((line, index) => `${String(index + 1).padStart(4)}  ${line}`).join('\n'),
    clear: () => CLEAR,
    exit: () => {
      setTimeout(() => desktop?.close('terminal'), 700)
      return t.exit
    },
    neofetch,
    fortune,
    cowsay: (args, stdin) => cowsay(args.trim() || stdin?.trim() || t.moo),
    lolcat: (args, stdin) => {
      const text = args.trim() ? args : stdin
      return text ? <Rainbow text={text} /> : new Failure(t.lolcatUsage)
    },
    weather: () => <Weather t={t.weather} />,
    ping: (args) => {
      const host = args.trim().split(/\s+/)[0] || 'giovannicruz.dev'
      const times = Array.from({ length: 4 }, () => (0.02 + Math.random() * 0.05).toFixed(3))
      return (
        <Reveal
          interval={450}
          lines={[
            `PING ${host} (127.0.0.1): 56 data bytes`,
            ...times.map((time, seq) => `64 bytes from 127.0.0.1: icmp_seq=${seq} ttl=64 time=${time} ms`),
            <span key="pong" className="text-[#a6e3a1]">
              {t.pong}
            </span>,
          ]}
        />
      )
    },
    hack: () => (
      <Reveal
        interval={600}
        lines={[
          t.hack.connecting,
          ...t.hack.steps.map((step) => (
            <Fragment key={step}>
              {step.padEnd(30, '.')} <span className="text-[#a6e3a1]">[OK]</span>
            </Fragment>
          )),
          <span key="granted" className="text-[#a6e3a1]">
            {t.hack.granted}
          </span>,
          <span key="kidding" className="text-[#f9e2af]">
            {t.hack.kidding}
          </span>,
        ]}
      />
    ),
    coffee: () => `${COFFEE}\n\n${t.coffee}`,
    whoami: () => 'guest@cruz-os',
    date: () => t.date(),
    echo: (args) => args,
    love: () => JESUS,
    shutdown: () => {
      setTimeout(() => desktop?.shutDown(), 1500)
      return t.shutdown
    },
    reboot: () => {
      setTimeout(() => desktop?.restart(), 1500)
      return t.reboot
    },

    // Hidden: for the curious
    sudo: (args) => {
      if (!args.trim()) return new Failure(t.sudoUsage)
      return /^make me a sandwich$/i.test(args.trim()) ? t.sandwich : new Failure(t.sudo)
    },
    make: (args) => (/^me a sandwich$/i.test(args.trim()) ? t.makeSandwich : new Failure(t.make)),
    rm: (args) => new Failure(t.rm(args.trim())),
    vim: () => t.vim,
    nano: () => t.editor('nano'),
    emacs: () => t.editor('emacs'),
    code: () => t.editor('code'),
    ':q': () => t.quit,
    cd: (args) => (['', '~'].includes(args.trim()) ? null : t.cd),
    pwd: () => '/home/guest',
    sl: () => <Train done={t.sl} />,
    hello: () => t.hello,
    uptime: () => t.uptime(uptime()),
  }

  const aliases: Record<string, string> = {
    jesus: 'love',
    faith: 'love',
    god: 'love',
    fastfetch: 'neofetch',
    logout: 'exit',
    cls: 'clear',
    poweroff: 'shutdown',
    halt: 'shutdown',
    restart: 'reboot',
    vi: 'vim',
    nvim: 'vim',
    ':q!': ':q',
    ':wq': ':q',
    ':x': ':q',
    hi: 'hello',
    hey: 'hello',
    oi: 'hello',
    ola: 'hello',
    olá: 'hello',
  }

  const find = (name: string): Command | undefined => {
    const key = Object.hasOwn(aliases, name) ? aliases[name] : name
    return Object.hasOwn(commands, key) ? commands[key] : undefined
  }

  // Everything Tab can complete and "did you mean" can suggest
  const names = [...Object.keys(commands), ...Object.keys(aliases)].filter((name) => /^[a-z]/.test(name))

  const notFound = (name: string) => {
    let guess: string | undefined
    let best = name.length > 4 ? 3 : 2
    for (const candidate of names) {
      const edits = distance(name.toLowerCase(), candidate)
      if (edits < best) [guess, best] = [candidate, edits]
    }
    return new Failure(t.commandNotFound(name, guess))
  }

  // Runs a line, passing each command's text on to the next one through pipes
  const execute = (line: string): Output | typeof CLEAR => {
    const stages = line.split('|')
    let stdin: string | null = null
    let output: Output | typeof CLEAR = null
    for (const stage of stages) {
      const [, name, args] = stage.trim().match(/^(\S*)\s*([\s\S]*)$/)!
      if (!name) return stages.length > 1 ? new Failure(t.pipeError) : null
      const command = find(name.toLowerCase())
      if (!command) return notFound(name)
      output = command(args, stdin)
      if (output instanceof Failure || output === CLEAR) return output
      stdin = typeof output === 'string' ? output : null
    }
    return output
  }

  const print = (command: string, output: Output) => {
    const id = nextId.current++
    setHistory((prev) => [...prev, { id, command, output }])
  }

  const submit = (line: string) => {
    const trimmed = line.trim()
    if (trimmed && log.current[log.current.length - 1] !== trimmed) log.current.push(trimmed)
    browsing.current = null
    setCurrentInput('')
    const output = execute(line)
    if (output === CLEAR) setHistory([])
    else print(line, output)
  }

  // ↑ and ↓ walk through what was typed before, and back to the line being typed
  const browse = (step: number) => {
    const entries = log.current
    if (!entries.length) return
    const state = browsing.current ?? { index: entries.length, draft: currentInput }
    const index = Math.min(Math.max(state.index + step, 0), entries.length)
    browsing.current = index === entries.length ? null : { ...state, index }
    setCurrentInput(index === entries.length ? state.draft : entries[index])
  }

  // Completes the command, or the file after cat and the app after open; lists the options when there are several
  const complete = () => {
    // Only what's after the last pipe is being typed
    const pipe = currentInput.lastIndexOf('|') + 1
    const segment = currentInput.slice(pipe)
    const argumentOptions: Record<string, string[]> = { cat: files.map((file) => file.name), open: appNames }
    const asCommand = segment.match(/^(\s*)(\S*)$/)
    const asArgument = segment.match(/^(\s*(\S+)\s+)(\S*)$/)
    const target = asCommand
      ? { prefix: asCommand[1], word: asCommand[2], options: names }
      : asArgument && Object.hasOwn(argumentOptions, asArgument[2].toLowerCase())
        ? { prefix: asArgument[1], word: asArgument[3], options: argumentOptions[asArgument[2].toLowerCase()] }
        : null
    if (!target) return

    const start = currentInput.slice(0, pipe) + target.prefix
    const word = target.word.toLowerCase()
    const matches = target.options.filter((option) => option.startsWith(word)).sort()
    if (!matches.length) return
    if (matches.length === 1) return setCurrentInput(`${start}${matches[0]} `)
    let common = matches[0]
    for (const match of matches) while (!match.startsWith(common)) common = common.slice(0, -1)
    if (common.length > word.length) setCurrentInput(start + common)
    else print(currentInput, matches.join('  '))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit(currentInput)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      browse(e.key === 'ArrowUp' ? -1 : 1)
    } else if (e.key === 'Tab' && !e.shiftKey && currentInput.trim()) {
      // An empty line lets Tab move focus on, so the terminal never traps the keyboard
      e.preventDefault()
      complete()
    } else if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setHistory([])
    } else if (
      e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      e.key.toLowerCase() === 'c' &&
      // With text selected in the line, it still copies
      e.currentTarget.selectionStart === e.currentTarget.selectionEnd
    ) {
      e.preventDefault()
      print(`${currentInput}^C`, null)
      setCurrentInput('')
      browsing.current = null
    }
  }

  // Clicking anywhere types into the prompt, unless it was to select text to copy
  const focusInput = () => {
    if (!window.getSelection()?.toString()) inputRef.current?.focus()
  }

  return (
    <main
      ref={terminalRef}
      className="h-full bg-[#1e1e2e] text-[#cdd6f4] selection:bg-[#9399b2]/30 font-mono text-xs md:text-sm p-3 cursor-text"
      style={{
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
      onClick={focusInput}
    >
      <div ref={contentRef}>
        {/* Welcome message */}
        <div className="mb-4 text-[#9399b2]">
          {lastLogin && (
            <p>
              {t.lastLogin(
                lastLogin.toLocaleString(localeTags[locale], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              )}
            </p>
          )}
          <p>Cruz OS Terminal v2.0</p>
          <p>{t.welcome}</p>
          <p className="mt-2">---</p>
        </div>

        {/* Command history */}
        {history.map((entry) => (
          <div key={entry.id} className="mb-2">
            <div className="flex">
              <Prompt />
              <span className="break-all">{entry.command}</span>
            </div>
            <OutputView output={entry.output} />
          </div>
        ))}

        {/* Current input line */}
        <div className="flex items-center">
          <Prompt />
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => {
              browsing.current = null
              setCurrentInput(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 bg-transparent text-[#cdd6f4] outline-none border-none caret-[#f5e0dc]"
            aria-label="Terminal"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      </div>
    </main>
  )
}
