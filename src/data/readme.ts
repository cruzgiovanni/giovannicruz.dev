import type { Locale } from '@/lib/i18n'
import { siteConfig } from './config'
import { getInfo, SHOW_PROJECTS } from './info'

export interface ReadmeFile {
  id: 'home' | 'about' | 'skills' | 'projects' | 'contact'
  name: string
  markdown: string
}

const copy = {
  en: {
    names: { home: 'home.md', about: 'about.md', skills: 'skills.md', projects: 'projects.md', contact: 'contact.md' },
    welcome: 'Welcome',
    intro: (name: string) => `I'm **${name}**.`,
    cruztosh:
      'Cruztosh: a portfolio disguised as a machine. Inspired by Mac OS 9, 1999. With my own touch. Navigate the menus. Open the windows. Explore.',
    editable: 'Every tab here is a Markdown file, and you can edit any of them. Write whatever you like: nothing is saved.',
    about: 'About me',
    quickFacts: 'Quick facts',
    skills: 'Skills',
    projects: 'Projects',
    source: 'Source',
    demo: 'Demo',
    contact: 'Contact',
    contactIntro: "Feel free to reach out! I'm always open to discussing new projects, creative ideas, or opportunities.",
    findMe: 'Find me on',
  },
  pt: {
    // "stack" matches the Terminal and fits the tab bar on phones
    names: { home: 'inicio.md', about: 'sobre.md', skills: 'stack.md', projects: 'projetos.md', contact: 'contato.md' },
    welcome: 'Bem-vindo',
    intro: (name: string) => `Sou o **${name}**.`,
    cruztosh:
      'Cruztosh: um portfólio disfarçado de máquina. Inspirado no Mac OS 9, de 1999. Com o meu toque. Navegue pelos menus. Abra as janelas. Explore.',
    editable: 'Cada aba aqui é um arquivo Markdown, e você pode editar qualquer uma. Escreva o que quiser: nada é salvo.',
    about: 'Sobre mim',
    quickFacts: 'Fatos rápidos',
    skills: 'Stack',
    projects: 'Projetos',
    source: 'Código',
    demo: 'Demo',
    contact: 'Contato',
    contactIntro:
      'Fique à vontade para entrar em contato! Estou sempre aberto a conversar sobre novos projetos, ideias criativas ou oportunidades.',
    findMe: 'Me encontre em',
  },
}

// Blocks separated by a blank line, as Markdown expects
const markdown = (...blocks: string[]) => blocks.filter(Boolean).join('\n\n')
const list = (items: string[]) => items.join('\n')

/** The ReadMe's documents, one Markdown file per tab, in the given language. */
export function getReadmeFiles(locale: Locale): ReadmeFile[] {
  const t = copy[locale]
  const { hero, aboutSection, skillCategories, projects, contactSection } = getInfo(locale)

  const files: ReadmeFile[] = [
    {
      id: 'home',
      name: t.names.home,
      markdown: markdown(
        `# ${t.welcome}`,
        t.intro(hero.name),
        hero.description,
        hero.paragraph,
        '---',
        `_${t.cruztosh}_`,
        `> ${t.editable}`,
      ),
    },
    {
      id: 'about',
      name: t.names.about,
      markdown: markdown(
        `# ${t.about}`,
        ...aboutSection.paragraphs.map((paragraph) => paragraph.trim()),
        `_${aboutSection.signature}_`,
        `## ${t.quickFacts}`,
        list(aboutSection.stats.map((stat) => `- **${stat.value}** ${stat.label}`)),
      ),
    },
    {
      id: 'skills',
      name: t.names.skills,
      markdown: markdown(
        `# ${t.skills}`,
        ...skillCategories.flatMap((category) => [
          `## ${category.title}`,
          category.description,
          category.technologies.map((technology) => `\`${technology}\``).join(' '),
        ]),
      ),
    },
  ]

  if (SHOW_PROJECTS) {
    files.push({
      id: 'projects',
      name: t.names.projects,
      markdown: markdown(
        `# ${t.projects}`,
        ...projects.flatMap((project) => [
          `## ${project.title}`,
          `${project.category} · ${project.year}`,
          project.tech,
          [project.repo && `[${t.source}](${project.repo})`, project.demo && `[${t.demo}](${project.demo})`]
            .filter(Boolean)
            .join(' · '),
        ]),
      ),
    })
  }

  files.push({
    id: 'contact',
    name: t.names.contact,
    markdown: markdown(
      `# ${t.contact}`,
      t.contactIntro,
      list([
        `- **${contactSection.email.label}:** [${contactSection.email.value}](mailto:${contactSection.email.value})`,
        `- **${contactSection.location.label}:** ${contactSection.location.value}`,
      ]),
      `## ${t.findMe}`,
      list([`- [GitHub](${siteConfig.socials.github})`, `- [LinkedIn](${siteConfig.socials.linkedin})`]),
    ),
  })

  return files
}
