import Link from 'next/link'
import { Navbar } from '@/components/lp/sections/navbar'
import { contactContent } from '@/data/lp-info'

const notFoundNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Contato', href: contactContent.whatsapp },
]

export default function NotFound() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <Navbar navLinks={notFoundNavLinks} />

      <div className="relative z-10 flex h-full flex-col items-end justify-end pb-16 pr-6 sm:pr-12">
        <p className="text-[0.65rem] font-semibold text-muted-foreground tracking-widest uppercase mb-2">
          Erro
        </p>
        <h1 className="text-[6rem] sm:text-[10rem] font-bold leading-none tracking-tighter text-foreground">
          404
        </h1>
        <p className="text-sm text-muted-foreground mb-6 font-semibold">
          Página não encontrada.
        </p>
        <Link
          href="/"
          className="text-[0.65rem] font-semibold text-foreground border border-border/60 px-4 py-2 hover:bg-secondary transition-colors tracking-widest uppercase"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
