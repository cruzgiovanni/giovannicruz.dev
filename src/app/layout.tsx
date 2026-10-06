import '@/app/globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { GeistPixelSquare, GeistPixelGrid, GeistPixelCircle, GeistPixelTriangle, GeistPixelLine } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteAnalytics } from '@/components/site-analytics'
import { LocaleProvider } from '@/components/locale-provider'
import { localeTags } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

// One text for every language: terms read the same almost anywhere, so whoever gets the link knows what it is
const description = 'Software Developer · Portfolio'

// The preview image is app/opengraph-image.tsx
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const ogLocale = (tag: string) => tag.replace('-', '_')
  return {
    metadataBase: new URL('https://giovannicruz.dev'),
    title: 'Giovanni Cruz',
    description,
    manifest: '/site.webmanifest',
    appleWebApp: {
      title: 'Giovanni Cruz',
    },
    openGraph: {
      type: 'website',
      url: '/',
      siteName: 'Giovanni Cruz',
      title: 'Giovanni Cruz',
      description,
      locale: ogLocale(localeTags[locale]),
      alternateLocale: ogLocale(localeTags[locale === 'pt' ? 'en' : 'pt']),
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Giovanni Cruz',
      description,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={localeTags[locale]} className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {/* Skipped inside the CruzTosh iframe on the home page, so a visit counts once */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            if (window.self === window.top) {
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1387355483213773');
              fbq('track', 'PageView');
            }
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1387355483213773&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <LocaleProvider locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </LocaleProvider>
        <SiteAnalytics />
      </body>
    </html>
  )
}
