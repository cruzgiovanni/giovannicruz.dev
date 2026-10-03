import { headers } from 'next/headers'
import { localeFromAcceptLanguage } from '@/lib/i18n'

/** The visitor's language, from the browser's preferences. Server only. */
export async function getLocale() {
  return localeFromAcceptLanguage((await headers()).get('accept-language'))
}
