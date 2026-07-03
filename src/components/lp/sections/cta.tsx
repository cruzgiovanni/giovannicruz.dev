import Link from 'next/link'
import { ctaContent, contactContent } from '@/data/lp-info'
const { title, buttonText } = ctaContent

export function CTA() {
  return (
    <section id="contact" className="relative bg-background py-12 md:py-20 mb-[10dvh] md:mb-[15dvh]">
      <div className="relative px-2 md:px-4">
        <div>
          <h2 className="text-muted-foreground font-sans font-bold text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[0.98]">
            {title.line1}
            <br />
            <span className="">{title.line2}</span>
          </h2>

          <div className="mt-6">
            <Link
              href={contactContent.whatsapp}
              target="_blank"
              className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs font-medium hover:bg-foreground/90 transition-colors group"
            >
              {buttonText}
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
