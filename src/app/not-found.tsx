import Link from 'next/link'
import { getLocale } from '@/lib/locale'

const copy = {
  en: { message: 'Page not found.', back: 'Back to home' },
  pt: { message: 'Página não encontrada.', back: 'Voltar ao início' },
}

// Same two-tone statement as the hero, on its own
export default async function NotFound() {
  const t = copy[await getLocale()]

  return (
    <main className="flex h-[100svh] flex-col justify-end bg-background px-2 pb-6 md:px-4 md:pb-8">
      <div className="font-sans text-[clamp(1.75rem,4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.03em]">
        <h1 className="text-foreground">{t.message}</h1>
        <Link href="/" className="block w-fit text-neutral-500 transition-colors hover:text-foreground">
          {t.back}
        </Link>
      </div>
    </main>
  )
}
