import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

// The link preview: the address in the hero's two tones on black, beside the Macintosh with the portrait on its screen.
// The card around it already gives the name and the role, so the image doesn't repeat them. Drawn once, at build time.

export const alt = 'giovannicruz.dev'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PLATINUM = 'linear-gradient(180deg, #ece7db 0%, #ddd6c6 100%)'

export default async function OpengraphImage() {
  const [art, geist] = await Promise.all([
    readFile(join(process.cwd(), 'public/art.jpeg')),
    readFile(join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf')),
  ])
  const portrait = `data:image/jpeg;base64,${art.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          background: '#000000',
          fontFamily: 'Geist',
        }}
      >
        {/* The light the screen casts */}
        <div
          style={{
            position: 'absolute',
            left: 648,
            top: 0,
            width: 640,
            height: 630,
            background: 'radial-gradient(circle at 50% 42%, rgba(255, 244, 228, 0.13) 0%, rgba(0, 0, 0, 0) 62%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 80,
            bottom: 88,
            display: 'flex',
            fontSize: 72,
            lineHeight: 1.05,
            letterSpacing: -2.2,
          }}
        >
          <span style={{ color: '#fafafa' }}>giovannicruz</span>
          {/* Satori sets each color apart, 11px wider than the address in one run; measured, so it reads as one word */}
          <span style={{ color: '#737373', marginLeft: -11 }}>.dev</span>
        </div>

        {/* Macintosh Classic */}
        <div
          style={{
            position: 'absolute',
            left: 816,
            top: 107,
            width: 304,
            height: 416,
            display: 'flex',
            borderRadius: 18,
            background: PLATINUM,
            boxShadow: 'inset 0 2px 0 rgba(255, 255, 255, 0.75), inset 0 -2px 0 rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Bezel */}
          <div
            style={{
              position: 'absolute',
              left: 30,
              top: 30,
              width: 244,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: 'linear-gradient(180deg, #d3ccbb 0%, #e4dfd3 100%)',
              boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.28)',
            }}
          >
            {/* Tube */}
            <div
              style={{
                width: 218,
                height: 172,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                background: '#1e1e1c',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portrait}
                width={186}
                height={124}
                alt=""
                style={{
                  objectFit: 'cover',
                  borderRadius: 4,
                  boxShadow: '0 0 22px rgba(255, 255, 255, 0.22)',
                }}
              />
            </div>
          </div>

          {/* Where the Classic says "Macintosh", engraved */}
          <span
            style={{
              position: 'absolute',
              left: 36,
              top: 300,
              fontSize: 15,
              color: '#aaa290',
              textShadow: '0 1px 0 rgba(255, 255, 255, 0.7)',
            }}
          >
            CruzTosh
          </span>

          {/* Floppy drive */}
          <div
            style={{
              position: 'absolute',
              right: 40,
              top: 306,
              width: 88,
              height: 10,
              borderRadius: 3,
              background: '#3b3933',
              boxShadow: 'inset 0 2px 2px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.6)',
            }}
          />

          {/* Base */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: 304,
              height: 30,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
              background: 'linear-gradient(180deg, #d2cbba 0%, #c6bead 100%)',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Geist', data: geist, weight: 500, style: 'normal' }],
    },
  )
}
