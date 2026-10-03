import type { Localized } from '@/lib/i18n'

export const heroContent: Localized<{ greeting: string; role: string }> = {
  en: {
    greeting: "Hi, I'm Giovanni Cruz.",
    role: 'Software developer.',
  },
  pt: {
    greeting: 'Oi, sou o Giovanni Cruz.',
    role: 'Desenvolvedor de software.',
  },
}
