export type Locale = 'en' | 'pt'

export type Localized<T> = Record<Locale, T>

// Copy that reads the same in both languages can stay a plain string
export type Text = string | Localized<string>

export function localize(text: Text, locale: Locale) {
  return typeof text === 'string' ? text : text[locale]
}

// BCP 47 tags, for <html lang> and Intl formatting
export const localeTags: Localized<string> = { en: 'en-US', pt: 'pt-BR' }

/** Portuguese when it's the browser's preferred language, English for anything else. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  const preferred = (header ?? '')
    .split(',')
    .map((entry, index) => {
      const [tag, ...params] = entry.trim().toLowerCase().split(';')
      const quality = params.map((param) => param.trim()).find((param) => param.startsWith('q='))
      return { tag: tag.trim(), q: quality ? Number(quality.slice(2)) : 1, index }
    })
    .filter(({ tag, q }) => tag !== '' && tag !== '*' && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)[0]
  return preferred?.tag.split('-')[0] === 'pt' ? 'pt' : 'en'
}
