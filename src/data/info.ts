import { localize, type Locale, type Localized, type Text } from '@/lib/i18n'
import { siteConfig } from './config'

const hero = {
  name: 'Giovanni Cruz',
  badge: { en: 'Software Engineer', pt: 'Engenheiro de Software' },
  description: {
    en: 'I design systems with a strong sense of structure and restraint.',
    pt: 'Projeto sistemas com um forte senso de estrutura e contenção.',
  },
  paragraph: { en: 'Less noise. More intention.', pt: 'Menos ruído. Mais intenção.' },
}

// Projects stay hidden (ReadMe section and Terminal commands) until there's work worth showing.
// Set to true to bring them back.
export const SHOW_PROJECTS = false

interface Project {
  number: string
  title: Text
  category: Localized<string>
  year: string
  tech: string
  demo?: string
  repo?: string
  type: 'project' | 'experience'
}

const projects: Project[] = [
  {
    number: '01',
    title: 'giovannicruz.dev - landing page',
    category: { en: 'My own landing page about my work', pt: 'Minha landing page sobre o meu trabalho' },
    year: '2026',
    tech: 'Next.js • TypeScript • Tailwind CSS • Framer Motion',
    demo: 'https://giovannicruz.dev',
    type: 'project',
  },
  {
    number: '02',
    title: { en: 'Piva Insurances', pt: 'Piva Seguros' },
    category: { en: 'Insurance Management Platform', pt: 'Plataforma de gestão de seguros' },
    year: '2026',
    tech: 'Vite • React • TypeScript • Shadcn UI • Pocketbase',
    // repo: 'https://github.com/emiliobiasi/pivaseguros',
    type: 'experience',
  },
  {
    number: '03',
    title: { en: 'Solution Card', pt: 'Solução Card' },
    category: { en: 'Digital Health Platform', pt: 'Plataforma digital de saúde' },
    year: '07/2025',
    tech: 'Next.js • Tailwind CSS • Framer Motion',
    demo: 'https://solucaocard.com.br/',
    type: 'project',
  },
  {
    number: '04',
    title: { en: 'Book SaaS', pt: 'Livro SaaS' },
    category: { en: 'SaaS with Auth & Subscriptions', pt: 'SaaS com autenticação e assinaturas' },
    year: '02/2025',
    tech: 'Next.js • Prisma • Stripe • NextAuth',
    repo: 'https://github.com/cruzgiovanni/livroSaas',
    type: 'project',
  },
  {
    number: '05',
    title: 'Delivery FSW',
    category: { en: 'Real-time Delivery System', pt: 'Sistema de delivery em tempo real' },
    year: '02/2025',
    tech: 'Next.js • Prisma • NeonDB • Stripe',
    repo: 'https://github.com/cruzgiovanni/fsw-delivery',
    type: 'project',
  },
]

interface SkillCategory {
  title: string
  description: Localized<string>
  technologies: Text[]
  color: string
}

const skillCategories: SkillCategory[] = [
  {
    title: 'Backend',
    description: {
      en: 'Building scalable APIs and server-side systems',
      pt: 'Construindo APIs escaláveis e sistemas no servidor',
    },
    technologies: [
      'Java',
      'Spring',
      'TypeScript',
      'Bun',
      'Node.js',
      'PostgreSQL',
      { en: 'NoSQL Databases', pt: 'Bancos NoSQL' },
      'ORMs',
      { en: 'BaaS Platforms', pt: 'Plataformas BaaS' },
    ],
    color: '#89b4fa',
  },
  {
    title: 'DevOps',
    description: {
      en: 'Deploying and maintaining production systems',
      pt: 'Publicando e mantendo sistemas em produção',
    },
    technologies: ['Docker', 'Github Actions', 'AWS', 'Linux', 'Git'],
    color: '#f5c2e7',
  },
  {
    title: 'Frontend',
    description: {
      en: 'Crafting intuitive interfaces and user experiences',
      pt: 'Criando interfaces intuitivas e boas experiências de uso',
    },
    technologies: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'],
    color: '#94e2d5',
  },
  {
    title: 'Blockchain',
    description: {
      en: 'Developing smart contracts and Web3 solutions',
      pt: 'Desenvolvendo smart contracts e soluções Web3',
    },
    technologies: ['Solidity', 'Hardhat', 'Ethereum'],
    color: '#fab387',
  },
]

const yearsInSoftware = `${new Date().getFullYear() - 2023}+`

const aboutSection: Localized<{
  paragraphs: string[]
  signature: string
  stats: { value: string; label: string; accent: boolean }[]
}> = {
  en: {
    paragraphs: [
      'I’m a Software Engineer drawn to systems and aesthetics that age well. ',
      'In code, that means structure, restraint, and clarity.',
      'Outside of it, the same principles apply.',
      'Software. Habits. Style.',
    ],
    signature: '// I code on faith and old blues from the 70s.',
    stats: [
      { value: yearsInSoftware, label: 'in software development', accent: true },
      { value: 'Catholic', label: 'by nature', accent: true },
    ],
  },
  pt: {
    paragraphs: [
      'Sou um Engenheiro de Software atraído por sistemas e estéticas que envelhecem bem.',
      'No código, isso significa estrutura, contenção e clareza.',
      'Fora dele, os mesmos princípios valem.',
      'Software. Hábitos. Estilo.',
    ],
    signature: '// Programo movido a fé e a blues antigo dos anos 70.',
    stats: [
      { value: yearsInSoftware, label: 'em desenvolvimento de software', accent: true },
      { value: 'Católico', label: 'por natureza', accent: true },
    ],
  },
}

const contactLabels: Localized<{ email: string; location: string }> = {
  en: { email: 'Email', location: 'Location' },
  pt: { email: 'E-mail', location: 'Localização' },
}

/** The portfolio content, in the given language. */
export function getInfo(locale: Locale) {
  return {
    hero: {
      name: hero.name,
      badge: hero.badge[locale],
      description: hero.description[locale],
      paragraph: hero.paragraph[locale],
    },
    projects: projects.map((project) => ({
      ...project,
      title: localize(project.title, locale),
      category: project.category[locale],
    })),
    skillCategories: skillCategories.map((category) => ({
      ...category,
      description: category.description[locale],
      technologies: category.technologies.map((technology) => localize(technology, locale)),
    })),
    aboutSection: aboutSection[locale],
    contactSection: {
      email: { label: contactLabels[locale].email, value: siteConfig.email },
      location: { label: contactLabels[locale].location, value: siteConfig.location[locale] },
    },
  }
}
