import React from 'react'
import { footerContent, contactContent } from '@/data/lp-info'
import { FooterNavLink } from './footer-nav-link'

const { logoText, ctaText, ctaLinkText, navLinks, email, socialLinks, copyright } = footerContent

export function Footer() {
  return (
    <footer className="relative bg-background">
      {/* Giant Logo - Full width edge to edge, NO padding */}
      <div className="w-full overflow-hidden" style={{ height: '20vw' }}>
        <h1
          className="w-full text-[20vw] leading-none text-[#b8b8b8] -mb-4"
          style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 1000,
            letterSpacing: '-0.05em',
          }}
        >
          {logoText}
        </h1>
      </div>

      {/* Horizontal line - with padding to match content */}
      <div className="px-2 md:px-4 -mt-0.5 md:-mt-4">
        <div className="h-px bg-border/50" />
      </div>

      {/* Footer content - tall section like basement */}
      <div className="min-h-[55dvh] flex flex-col justify-end px-2 md:px-4 pb-20 md:pb-4 w-full">
        {/* CTA - desktop only */}
        <div className="hidden md:block mb-8">
          <p className="text-xl text-foreground tracking-tight mb-4">{ctaText}</p>
          <a
            href={contactContent.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-foreground hover:text-muted-foreground transition-colors group"
          >
            {ctaLinkText}
            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="space-y-0 mb-8 ">
          {navLinks.map((link) => (
            <FooterNavLink key={link.label} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Social/Copyright */}
        <div className="flex flex-col gap-1 text-[0.9rem]">
          <div className="flex items-center gap-2 text-muted-foreground">
            {socialLinks.map((link, index) => (
              <React.Fragment key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
                <span>-</span>
              </React.Fragment>
            ))}
            <a
              href={`mailto:${email}`}
              className="hover:text-foreground transition-colors"
            >
              {email}
            </a>
          </div>
          <p className="text-muted-foreground text-[0.7rem] md:text-[0.9rem]">{copyright(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  )
}
