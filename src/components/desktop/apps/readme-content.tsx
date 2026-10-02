'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Mail, MapPin, ExternalLink, Code } from 'lucide-react'
import { Github, Linkedin } from '@/components/ui/brand-icons'
import { skillCategories, aboutSection, projects, hero, contactSection } from '@/data/info'
import { siteConfig } from '@/data/config'
import art from '../../../../public/art.jpeg'
import me from '../../../../public/me.jpeg'

type Page = 'home' | 'about' | 'skills' | 'projects' | 'contact'

export function ReadmeContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const navItems: { id: Page; label: string }[] = [
    { id: 'home', label: 'HOME' },
    { id: 'about', label: 'ABOUT' },
    { id: 'skills', label: 'SKILLS' },
    { id: 'projects', label: 'PROJECTS' },
    { id: 'contact', label: 'CONTACT' },
  ]

  return (
    <div
      className="flex flex-col md:flex-row h-full min-h-full"
      style={{ fontFamily: "var(--font-geist-pixel-square)" }}
    >
      {/* ========== MOBILE TOP NAV ========== */}
      <header className="md:hidden shrink-0 border-b border-[#c0c0c0] bg-white">
        <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2">
          <h2
            className="text-xl xs:text-2xl text-[#2a2a2a] leading-tight tracking-tight"
            style={{
              fontFamily: 'var(--font-geist-pixel-square)',
              fontWeight: 700,
            }}
          >
            Giovanni Cruz
          </h2>
          <p className="text-xs xs:text-sm text-[#888888] shrink-0">
            Portfolio &apos;{new Date().getFullYear().toString().slice(-2)}
          </p>
        </div>
        <nav className="grid grid-cols-5 px-2 pb-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`text-[10px] xs:text-xs transition-colors py-1 cursor-pointer text-center ${
                currentPage === item.id
                  ? 'text-[#000000] font-bold underline'
                  : 'text-[#000066] hover:text-[#0000cc]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ========== SIDEBAR (desktop) ========== */}
      <aside className="hidden md:flex md:w-48 shrink-0 flex-col md:pt-8 md:px-5 border-r border-[#c0c0c0] bg-white">
        {/* Logo/Name */}
        <div className="md:mb-10">
          <h2
            className="md:text-3xl text-[#2a2a2a] leading-tight tracking-tight"
            style={{
              fontFamily: 'var(--font-geist-pixel-square)',
              fontWeight: 700,
            }}
          >
            Giovanni
            <br />
            Cruz
          </h2>
          <p className="md:text-base text-[#888888] md:mt-2">
            Portfolio &apos;{new Date().getFullYear().toString().slice(-2)}
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col md:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`text-left md:text-lg transition-colors flex items-center md:gap-2 md:py-1 cursor-pointer ${
                currentPage === item.id ? 'text-[#000000] font-bold' : 'text-[#000066] hover:text-[#0000cc]'
              }`}
            >
              {currentPage === item.id && <span className="text-[#000066] md:text-base">○</span>}
              <span className={currentPage === item.id ? 'underline' : ''}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 md:px-8 py-4 sm:py-6 md:py-8 bg-white"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* ========== HOME PAGE ========== */}
        {currentPage === 'home' && (
          <div>
            <h1
              className="text-3xl sm:text-4xl md:text-6xl text-[#2a2a2a] mb-2 sm:mb-3"
              style={{
                fontFamily: 'var(--font-geist-pixel-square)',
                fontWeight: 700,
              }}
            >
              Welcome
            </h1>
            <p
              className="text-base sm:text-lg md:text-2xl text-[#2a2a2a] italic mb-4 sm:mb-6"
              style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
            >
              I&apos;m {hero.name}
            </p>

            {/* Photo */}
            <div className="float-right ml-3 sm:ml-6 mb-3 sm:mb-4">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 border-2 border-[#cccccc] p-1 bg-[#f5f5f5]">
                <Image
                  src={art}
                  alt="Giovanni Cruz"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover grayscale-[20%]"
                />
              </div>
            </div>

            <p className="text-sm sm:text-base md:text-xl text-[#1a1a1a] leading-relaxed mb-4 sm:mb-6 text-justify">
              {hero.description}
            </p>

            <p className="text-xs sm:text-sm md:text-lg text-[#333333] leading-relaxed mb-4 sm:mb-6 text-justify">
              {hero.paragraph}
            </p>

            <p className="text-[10px] sm:text-xs md:text-sm text-[#555555] leading-relaxed mb-4 sm:mb-6">
              <span className="italic">Cruztosh</span>: a portfolio disguised as a machine. Inspired by Mac OS 9, 1999.
              With my own touch. Navigate the menus. Open the windows. Explore.
            </p>

            <div className="clear-both" />

            {/* Mobile hint */}
            <div className="md:hidden mt-6 p-3 bg-[#fffef0] border border-[#e0d890] text-center">
              <p className="text-[11px] text-[#666655] leading-relaxed">
                <span className="text-base">💻</span>
                <br />
                <span className="italic">
                  Tip: Visit on a computer for the full retro Macintosh (Cruztosh) experience!
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ========== ABOUT PAGE ========== */}
        {currentPage === 'about' && (
          <div>
            <h1
              className="text-3xl sm:text-4xl md:text-6xl text-[#2a2a2a] mb-4 sm:mb-6"
              style={{
                fontFamily: 'var(--font-geist-pixel-square)',
                fontWeight: 700,
              }}
            >
              About Me
            </h1>

            {/* Photo */}
            <div className="float-left mr-3 sm:mr-6 mb-3 sm:mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 border-2 border-[#cccccc] p-1 bg-[#f5f5f5]">
                <Image src={me} alt="Giovanni Cruz" width={176} height={176} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className=" space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-lg  leading-relaxed text-justify">
              {aboutSection.paragraphs.map((p, i) => (
                <p className="text-[#1a1a1a]" key={i}>
                  {p}
                </p>
              ))}
              <div className="text-[#1a1a1a]/60 italic">{aboutSection.signature}</div>
            </div>

            <div className="clear-both" />

            {/* Stats */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#e0e0e0]">
              <h2
                className="text-lg sm:text-xl md:text-2xl font-bold text-[#2a2a2a] mb-3 sm:mb-4"
                style={{ fontFamily: "var(--font-geist-pixel-square)" }}
              >
                Quick Facts
              </h2>
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {aboutSection.stats.map((stat, i) => (
                  <div key={i} className="p-2 sm:p-3 md:p-4 bg-[#f8f8f8] border border-[#e0e0e0] ">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#000066]">{stat.value}</span>
                    <span className=" text-xs sm:text-sm md:text-base text-[#666666] ml-2">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== SKILLS PAGE ========== */}
        {currentPage === 'skills' && (
          <div>
            <h1
              className="text-3xl sm:text-4xl md:text-6xl text-[#2a2a2a] mb-4 sm:mb-6"
              style={{
                fontFamily: 'var(--font-geist-pixel-square)',
                fontWeight: 700,
              }}
            >
              Skills
            </h1>

            <div className="space-y-6 sm:space-y-8">
              {skillCategories.map((category) => (
                <div key={category.title} className="pb-4 sm:pb-6 border-b border-[#e0e0e0] last:border-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={{ backgroundColor: category.color }} />
                    <h2
                      className="text-lg sm:text-xl md:text-3xl font-bold text-[#2a2a2a]"
                      style={{ fontFamily: "var(--font-geist-pixel-square)" }}
                    >
                      {category.title}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm md:text-lg text-[#666666] mb-3 sm:mb-4">{category.description}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {category.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm md:text-base text-[#1a1a1a] bg-[#f0f0f0] border border-[#d0d0d0] hover:bg-[#e8e8e8] transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== PROJECTS PAGE ========== */}
        {currentPage === 'projects' && (
          <div>
            <h1
              className="text-3xl sm:text-4xl md:text-6xl text-[#2a2a2a] mb-4 sm:mb-6"
              style={{
                fontFamily: 'var(--font-geist-pixel-square)',
                fontWeight: 700,
              }}
            >
              Projects
            </h1>

            <div className="space-y-4 sm:space-y-6">
              {projects.map((project) => (
                <div
                  key={project.title}
                  className="p-3 sm:p-4 md:p-5 bg-[#fafafa] border border-[#e0e0e0] hover:border-[#cccccc] hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 mb-2">
                    <h2
                      className="text-base sm:text-lg md:text-2xl font-bold text-[#2a2a2a]"
                      style={{ fontFamily: "var(--font-geist-pixel-square)" }}
                    >
                      {project.title}
                    </h2>
                    <span className="text-xs sm:text-sm md:text-base text-[#888888] bg-[#f0f0f0] px-2 py-0.5 sm:py-1 w-fit shrink-0">
                      {project.year}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-[#444444] mb-1 sm:mb-2">{project.category}</p>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] mb-3 sm:mb-4 break-words">
                    {project.tech}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {project.repo && (
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base text-[#333333] bg-[#ffffff] border border-[#333333] hover:bg-[#f5f5f5] transition-colors"
                      >
                        <Code size={14} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="hidden xs:inline">Source</span>
                        <span className="xs:hidden">Code</span>
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base text-[#333333] bg-[#ffffff] border border-[#333333] hover:bg-[#f5f5f5] transition-colors"
                      >
                        <ExternalLink size={14} className="sm:w-[18px] sm:h-[18px]" />
                        Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== CONTACT PAGE ========== */}
        {currentPage === 'contact' && (
          <div>
            <h1
              className="text-3xl sm:text-4xl md:text-6xl text-[#2a2a2a] mb-4 sm:mb-6"
              style={{
                fontFamily: 'var(--font-geist-pixel-square)',
                fontWeight: 700,
              }}
            >
              Contact
            </h1>

            <p className="text-xs sm:text-sm md:text-lg text-[#444444] mb-6 sm:mb-8">
              Feel free to reach out! I&apos;m always open to discussing new projects, creative ideas, or opportunities.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <a
                href={`mailto:${contactSection.email.value}`}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#fafafa] border border-[#e0e0e0] hover:border-[#000066] hover:bg-[#f5f5ff] transition-all group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#000066] text-white group-hover:bg-[#0000aa] transition-colors shrink-0">
                  <Mail size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm md:text-base text-[#666666]">{contactSection.email.label}</p>
                  <p className="text-sm sm:text-base md:text-xl text-[#000066] font-bold break-all">
                    {contactSection.email.value}
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#fafafa] border border-[#e0e0e0]">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#666666] text-white shrink-0">
                  <MapPin size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm md:text-base text-[#666666]">{contactSection.location.label}</p>
                  <p className="text-sm sm:text-base md:text-xl text-[#1a1a1a] font-bold">
                    {contactSection.location.value}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h2
                className="text-base sm:text-xl md:text-2xl font-bold text-[#2a2a2a] mb-3 sm:mb-4"
                style={{ fontFamily: "var(--font-geist-pixel-square)" }}
              >
                Find me on
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <a
                  href={siteConfig.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 text-sm text-gray-700 md:text-lg border border-gray-50000 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  <Github size={18} className="sm:w-6 sm:h-6" />
                  GitHub
                </a>
                <a
                  href={siteConfig.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 text-sm text-gray-700 md:text-lg border border-gray-50000 bg-[#0077b5]/70 hover:bg-[#005c8f]/50 transition-colors"
                >
                  <Linkedin size={18} className="sm:w-6 sm:h-6" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-[#e0e0e0] text-center text-xs sm:text-sm md:text-base text-[#888888]">
          © {new Date().getFullYear()} Giovanni Cruz
        </footer>
      </main>
    </div>
  )
}
