import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/')({
  component: USMCHome,
})

const TABS = [
  { id: 'overview', label: 'Overview of USMC' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'divisions', label: 'Division Information' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'regulations', label: 'Marine Regulations' },
  { id: 'standing-orders', label: 'Standing Orders' },
  { id: 'releases', label: 'Public Releases' },
  { id: 'gallery', label: 'Photo Gallery' },
] as const

type TabId = (typeof TABS)[number]['id']

/* ─── Carousel Component ─────────────────────────────────────── */

function HomeCarousel() {
  const [slides, setSlides] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.from('carousel').select('*').order('sort_order').then(({ data }) => {
      setSlides(data || [])
    })
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [slides.length])

  if (slides.length === 0) return null

  const prev = () => { setCurrent(c => (c - 1 + slides.length) % slides.length) }
  const next = () => { setCurrent(c => (c + 1) % slides.length) }

  return (
    <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden', background: '#0a1a0a' }}>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          style={{
            position: 'absolute', inset: 0,
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.8s ease',
            pointerEvents: i === current ? 'auto' : 'none',
          }}
        >
          <img
            src={slide.image_url}
            alt={slide.caption || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(15%) contrast(1.1) brightness(0.75)' }}
          />
          {slide.caption && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
              <span style={{ color: '#e8d8b0', fontFamily: 'Share Tech Mono, monospace', fontSize: 13, letterSpacing: 1 }}>{slide.caption}</span>
            </div>
          )}
        </div>
      ))}
      {/* Gold overlay bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--marine-gold)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--marine-gold)' }} />
      {slides.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(180,140,40,0.4)', color: '#e8d8b0', width: 36, height: 36, borderRadius: 4, cursor: 'pointer', fontSize: 16 }}>‹</button>
          <button onClick={next} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(180,140,40,0.4)', color: '#e8d8b0', width: 36, height: 36, borderRadius: 4, cursor: 'pointer', fontSize: 16 }}>›</button>
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 20 : 8, height: 8, borderRadius: 4, background: i === current ? 'var(--marine-gold)' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Main Layout ────────────────────────────────────────────── */

function USMCHome() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--marine-bg)' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(180deg, #0d0f0d 0%, var(--marine-green-dark) 100%)', borderBottom: '3px solid var(--marine-gold)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden"
              style={{ border: '2px solid var(--marine-gold)' }}>
              <img src="/usmc-emblem.png" alt="USMC" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div className="text-xs tracking-widest mb-0.5" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace' }}>OSFUSA ROBLOX RP</div>
              <h1 className="text-xl md:text-2xl font-bold leading-tight" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.1em', color: 'var(--marine-tan-light)', textTransform: 'uppercase' }}>
                United States Marine Corps
              </h1>
              <div className="text-xs tracking-widest" style={{ color: 'var(--marine-gold)', fontFamily: 'Share Tech Mono, monospace' }}>SEMPER FIDELIS</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace', opacity: 0.6 }}>MADE BY GREYHOLIC</span>
            <button
              className="md:hidden p-2 rounded"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ color: 'var(--marine-tan)', border: '1px solid var(--marine-border)' }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: 'var(--marine-green-dark)', borderBottom: '1px solid var(--marine-border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="hidden md:flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  fontFamily: 'Oswald, sans-serif',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: activeTab === tab.id ? 'var(--marine-tan-light)' : 'var(--marine-tan-dark)',
                  background: activeTab === tab.id ? 'var(--marine-green)' : 'transparent',
                  borderBottom: activeTab === tab.id ? '3px solid var(--marine-gold)' : '3px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {menuOpen && (
            <div className="md:hidden flex flex-col border-t" style={{ borderColor: 'var(--marine-border)' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMenuOpen(false) }}
                  className="px-5 py-3 text-left text-sm font-semibold"
                  style={{
                    fontFamily: 'Oswald, sans-serif',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: activeTab === tab.id ? 'var(--marine-gold)' : 'var(--marine-tan-dark)',
                    background: activeTab === tab.id ? 'var(--marine-surface)' : 'transparent',
                    borderLeft: activeTab === tab.id ? '3px solid var(--marine-gold)' : '3px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Carousel — only on overview tab */}
      {activeTab === 'overview' && <HomeCarousel />}

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'leadership' && <LeadershipSection />}
        {activeTab === 'divisions' && <DivisionsSection />}
        {activeTab === 'announcements' && <AnnouncementsSection />}
        {activeTab === 'regulations' && <RegulationsSection />}
        {activeTab === 'standing-orders' && <StandingOrdersSection />}
        {activeTab === 'releases' && <ReleasesSection />}
        {activeTab === 'gallery' && <GallerySection />}
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

/* ─── Shared ─────────────────────────────────────────────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 pb-4" style={{ borderBottom: '1px solid var(--marine-border)' }}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-1 h-8 rounded" style={{ background: 'var(--marine-gold)' }} />
        <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--marine-tan-light)' }}>
          {title}
        </h2>
      </div>
      {subtitle && <p className="ml-4 text-sm" style={{ color: 'var(--marine-tan-dark)' }}>{subtitle}</p>}
    </div>
  )
}

function InfoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg p-5 mb-4 ${className}`} style={{ background: 'var(--marine-surface)', border: '1px solid var(--marine-border)' }}>
      {children}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <span style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace', fontSize: 13, letterSpacing: 2 }}>LOADING...</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg p-10 text-center" style={{ background: 'var(--marine-surface)', border: '1px solid var(--marine-border)' }}>
      <p style={{ color: 'var(--marine-tan-dark)', fontSize: 13, fontFamily: 'Share Tech Mono, monospace' }}>{message}</p>
    </div>
  )
}

/* ─── Site Footer ────────────────────────────────────────────── */

function SiteFooter() {
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const map: Record<string, string> = {}
      for (const s of data || []) map[s.key] = s.value
      setSettings(map)
    })
  }, [])

  return (
    <footer style={{ background: 'var(--marine-green-dark)', borderTop: '1px solid var(--marine-border)', color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace' }}>
      {/* Links row */}
      {(settings.discord_url || settings.roblox_community_url || settings.roblox_game_url) && (
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-6" style={{ borderBottom: '1px solid var(--marine-border)' }}>
          {settings.discord_url && (
            <a href={settings.discord_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:underline"
              style={{ color: 'var(--marine-tan)', textDecoration: 'none' }}>
              <span style={{ fontSize: 16 }}>💬</span> Discord Server
            </a>
          )}
          {settings.roblox_community_url && (
            <a href={settings.roblox_community_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:underline"
              style={{ color: 'var(--marine-tan)', textDecoration: 'none' }}>
              <span style={{ fontSize: 16 }}>👥</span> Roblox Community
            </a>
          )}
          {settings.roblox_game_url && (
            <a href={settings.roblox_game_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:underline"
              style={{ color: 'var(--marine-tan)', textDecoration: 'none' }}>
              <span style={{ fontSize: 16 }}>🎮</span> Roblox Game
            </a>
          )}
        </div>
      )}
      {/* Bottom row */}
      <div className="py-4 text-center text-xs">
        OSFUSA — UNITED STATES MARINE CORPS &nbsp;|&nbsp; SEMPER FIDELIS &nbsp;|&nbsp; ROBLOX RP GROUP
        <br />
        <span style={{ opacity: 0.5 }}>MADE BY GREYHOLIC</span>
        &nbsp;|&nbsp;
        <a href="/admin"
          style={{ color: 'var(--marine-tan-dark)', textDecoration: 'none', opacity: 0.5 }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.5')}>
          Admin Login
        </a>
      </div>
    </footer>
  )
}

/* ─── Overview Section ───────────────────────────────────────── */

function OverviewSection() {
  const blocks = [
    {
      heading: 'About the USMC',
      text: 'The United States Marine Corps (USMC) within OSFUSA is an elite military branch dedicated to upholding discipline, honor, and combat readiness in the Roblox RP environment. As the tip of the spear for OSFUSA\'s ground forces, the Marine Corps operates under strict military doctrine and chain of command.',
    },
    {
      heading: 'Mission Statement',
      text: 'The mission of the OSFUSA Marine Corps is to maintain a ready force of skilled and disciplined Marines capable of rapid deployment and combined arms operations. We exist to protect OSFUSA interests, enforce law and order, and project military power wherever directed by high command.',
    },
    {
      heading: 'Core Values',
      text: 'Honor · Courage · Commitment\n\nEvery Marine is expected to embody these three core values in all interactions, whether in training, on patrol, or in command. These values form the foundation of Marine Corps culture and are non-negotiable requirements for service.',
    },
    {
      heading: 'History & Heritage',
      text: 'Founded as a branch of the OSFUSA armed forces, the Marine Corps has grown from a small detachment into a full combined-arms force. Through numerous campaigns, exercises, and joint operations, the Corps has established a proud tradition of excellence and esprit de corps that defines every Marine who serves.',
    },
    {
      heading: 'Chain of Command',
      text: 'The Marine Corps operates under a clear and strictly enforced chain of command. All orders flow from the Commandant of the Marine Corps down through Generals, Colonels, Lieutenant Colonels, Majors, Captains, Lieutenants, Staff NCOs, NCOs, and finally to junior enlisted Marines. Respecting the chain of command is mandatory.',
    },
  ]

  const quickFacts = [
    { label: 'GROUP', value: 'OSFUSA' },
    { label: 'BRANCH', value: 'Marine Corps' },
    { label: 'MOTTO', value: 'Semper Fidelis' },
    { label: 'FOUNDED', value: 'OSFUSA Era' },
    { label: 'STATUS', value: 'Active' },
    { label: 'PLATFORM', value: 'Roblox RP' },
  ]

  return (
    <div>
      <SectionHeader title="Overview of the USMC" subtitle="OSFUSA — United States Marine Corps | General Information" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {blocks.map((block) => (
            <InfoCard key={block.heading}>
              <h3 className="text-xs font-bold mb-2" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--marine-gold)' }}>{block.heading}</h3>
              {block.text.split('\n\n').map((p, i) => (
                <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--marine-tan)', marginBottom: i < block.text.split('\n\n').length - 1 ? 8 : 0 }}>{p}</p>
              ))}
            </InfoCard>
          ))}
        </div>
        <div>
          <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--marine-surface)', border: '1px solid var(--marine-border)' }}>
            <h3 className="text-xs font-bold mb-3" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--marine-gold)' }}>Quick Facts</h3>
            {quickFacts.map((fact) => (
              <div key={fact.label} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--marine-border)' }}>
                <span className="text-xs" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace' }}>{fact.label}</span>
                <span className="text-xs" style={{ color: 'var(--marine-tan-light)', fontFamily: 'Share Tech Mono, monospace' }}>{fact.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--marine-surface)', border: '1px solid var(--marine-border)' }}>
            <img src="/usmc-emblem.png" alt="USMC Emblem" style={{ width: '100%', padding: 16, objectFit: 'contain' }} />
            <div className="p-2 text-center text-xs" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace', borderTop: '1px solid var(--marine-border)' }}>USMC — OSFUSA MARINES</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Leadership Section (Supabase) ──────────────────────────── */

function LeadershipSection() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('leadership').select('*').order('sort_order').then(({ data }) => {
      setMembers(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <SectionHeader title="Leadership" subtitle="OSFUSA Marine Corps — Commanding Officers & Senior Staff" />
      {loading ? <LoadingState /> : members.length === 0 ? <EmptyState message="NO LEADERSHIP RECORDS ON FILE" /> : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const isCommandant = member.title?.toLowerCase().includes('commandant')
            return (
              <div key={member.id} className="rounded-lg overflow-hidden" style={{ background: 'var(--marine-surface)', border: `1px solid ${isCommandant ? 'var(--marine-gold)' : 'var(--marine-border)'}` }}>
                <div style={{ width: '100%', height: 380, overflow: 'hidden', background: '#1a3a1a', position: 'relative' }}>
                  {member.image_url
                    ? <img src={member.image_url} alt={member.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: 'var(--marine-gold)', fontFamily: 'Oswald, sans-serif' }}>{member.username.slice(0, 2).toUpperCase()}</div>
                  }
                  {isCommandant && (
                    <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 4, background: 'rgba(180,140,40,0.85)', color: '#0a1a0a', fontFamily: 'Share Tech Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>COMMANDING</div>
                  )}
                </div>
                <div className="p-4" style={{ borderTop: `2px solid ${isCommandant ? 'var(--marine-gold)' : 'var(--marine-border)'}` }}>
                  <div className="font-bold text-base" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.06em', color: isCommandant ? 'var(--marine-gold)' : 'var(--marine-tan-light)', textTransform: 'uppercase' }}>{member.username}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--marine-tan-dark)' }}>{member.title}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Divisions Section (Supabase) ───────────────────────────── */

function DivisionsSection() {
  const [divisions, setDivisions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('divisions').select('*').order('sort_order').then(({ data }) => {
      setDivisions(data || [])
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div>
      <SectionHeader title="Division Information" subtitle="Marine Corps Organizational Structure — click a division to expand" />
      {loading ? <LoadingState /> : divisions.length === 0 ? <EmptyState message="NO DIVISIONS ON FILE" /> : (
        <div>
          {divisions.map((div) => (
            <div key={div.id} className="rounded-lg mb-3 overflow-hidden" style={{ background: 'var(--marine-surface)', border: `1px solid ${expanded === div.id ? 'var(--marine-gold)' : 'var(--marine-border)'}`, transition: 'border-color 0.2s' }}>
              <button onClick={() => toggle(div.id)} className="w-full flex items-center gap-4 p-4 text-left hover:brightness-110" style={{ background: div.color || '#1a2a3a', border: 'none', cursor: 'pointer', width: '100%' }}>
                <div style={{ width: 48, height: 48, borderRadius: 6, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', fontSize: 28 }}>
                  {div.icon_url
                    ? <img src={div.icon_url} alt={div.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : div.icon
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace' }}>[{div.code}] — {div.role}</div>
                  <div className="font-bold" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.08em', color: '#e8d8b0', textTransform: 'uppercase', fontSize: 15 }}>{div.name}</div>
                  {div.motto && <div className="text-xs mt-0.5 italic" style={{ color: 'rgba(232,216,176,0.55)' }}>"{div.motto}"</div>}
                </div>
                <div style={{ color: 'var(--marine-gold)', fontSize: 18, flexShrink: 0, transform: expanded === div.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
              </button>
              {expanded === div.id && (
                <div style={{ borderTop: '1px solid var(--marine-border)', background: 'rgba(0,0,0,0.2)' }}>
                  {div.image_url && (
                    <div style={{ width: '100%', height: 380, overflow: 'hidden' }}>
                      <img src={div.image_url} alt={div.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(15%) brightness(0.85)' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px' }}>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--marine-tan)' }}>{div.description}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      {div.leadership && div.leadership.length > 0 && (
                        <div>
                          <div className="text-xs font-bold mb-2" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.1em', color: 'var(--marine-gold)', textTransform: 'uppercase' }}>Leadership</div>
                          {div.leadership.map((l: string, i: number) => (
                            <div key={i} className="text-xs py-1.5" style={{ color: 'var(--marine-tan-dark)', borderBottom: '1px solid var(--marine-border)' }}>{l}</div>
                          ))}
                        </div>
                      )}
                      <div>
                        {div.entrance && (
                          <div className="mb-4">
                            <div className="text-xs font-bold mb-2" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.1em', color: 'var(--marine-gold)', textTransform: 'uppercase' }}>Entrance Method</div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--marine-tan-dark)' }}>{div.entrance}</p>
                          </div>
                        )}
                        {div.discord_label && (
                          <div>
                            <div className="text-xs font-bold mb-2" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.1em', color: 'var(--marine-gold)', textTransform: 'uppercase' }}>Communications</div>
                            {div.discord_url
                              ? <a href={div.discord_url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#4a9a4a' }}>Click here to access the {div.discord_label} ↗</a>
                              : <span className="text-xs" style={{ color: 'var(--marine-tan-dark)' }}>Click here to access the {div.discord_label}</span>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Announcements Section (Supabase) ──────────────────────── */

function AnnouncementsSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('announcements').select('*').order('sort_order').then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div>
      <SectionHeader title="Announcements" subtitle="Official announcements and updates from USMC command — click to read" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="NO ANNOUNCEMENTS ON FILE" /> : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="rounded-lg mb-3 overflow-hidden" style={{ background: 'var(--marine-surface)', border: `1px solid ${expanded === item.id ? 'var(--marine-gold)' : 'var(--marine-border)'}`, transition: 'border-color 0.2s' }}>
              <button onClick={() => toggle(item.id)} className="w-full flex items-center gap-4 p-4 text-left hover:brightness-110" style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>
                <div className="flex-1 min-w-0">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1a3a1a', color: '#5aaa5a', fontFamily: 'Share Tech Mono, monospace', border: '1px solid #2a5a2a', flexShrink: 0 }}>ANNOUNCEMENT</span>
                    <span className="text-xs" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace' }}>{item.date}</span>
                  </div>
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em', color: 'var(--marine-tan-light)', textTransform: 'uppercase' }}>{item.title}</div>
                </div>
                <div style={{ color: 'var(--marine-gold)', fontSize: 18, flexShrink: 0, transform: expanded === item.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
              </button>
              {expanded === item.id && (
                <div style={{ borderTop: '1px solid var(--marine-border)', background: 'rgba(0,0,0,0.2)' }}>
                  {item.image_url && (
                    <div style={{ width: '100%', height: 380, overflow: 'hidden' }}>
                      <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(15%) brightness(0.85)' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--marine-tan)' }}>{item.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Regulations Section (Supabase) ────────────────────────── */

function RegulationsSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('regulations').select('*').order('number').then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div>
      <SectionHeader title="Marine Regulations" subtitle="Official USMC regulations, policies, and governing documents — click to read" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="NO REGULATIONS ON FILE" /> : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="rounded-lg mb-3 overflow-hidden" style={{ background: 'var(--marine-surface)', border: `1px solid ${expanded === item.id ? 'var(--marine-gold)' : 'var(--marine-border)'}`, transition: 'border-color 0.2s' }}>
              {/* Header — always visible, click to expand */}
              <button
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-4 p-4 text-left transition-all hover:brightness-110"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
              >
                <div className="text-2xl flex-shrink-0" style={{ color: 'var(--marine-gold)' }}>📄</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em', color: 'var(--marine-tan-light)' }}>
                    Regulation No. {item.number}: {item.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--marine-tan-dark)' }}>
                    {expanded === item.id ? 'Click to collapse' : 'Click to read'}
                  </div>
                </div>
                <div style={{ color: 'var(--marine-gold)', fontSize: 18, flexShrink: 0, transform: expanded === item.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
              </button>
              {/* Expanded content */}
              {expanded === item.id && (
                <div style={{ borderTop: '1px solid var(--marine-border)', background: 'rgba(0,0,0,0.2)' }}>
                  {item.image_url && (
                    <div style={{ width: '100%', height: 380, overflow: 'hidden' }}>
                      <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(15%) brightness(0.85)' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px' }}>
                    {item.content ? (
                      <div className="text-sm leading-relaxed" style={{ color: 'var(--marine-tan)', fontFamily: 'Share Tech Mono, monospace', fontSize: 13 }}>
                        {item.content.split('\n').map((line: string, i: number) => {
                          const parts = line.split(/\*\*(.*?)\*\*/g)
                          return (
                            <p key={i} style={{ marginBottom: 6 }}>
                              {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'var(--marine-tan-light)' }}>{part}</strong> : part)}
                            </p>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{ color: 'var(--marine-tan-dark)' }}>No content available for this regulation.</p>
                    )}
                    {item.document_url && (
                      <a href={item.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-xs hover:underline" style={{ color: 'var(--marine-gold)', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        📄 View Full Document ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Standing Orders Section (Supabase) ────────────────────── */

function StandingOrdersSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('standing_orders').select('*').order('number').then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div>
      <SectionHeader title="Standing Orders" subtitle="Active directives and standing orders from USMC command — click to read" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="NO STANDING ORDERS ON FILE" /> : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="rounded-lg mb-3 overflow-hidden" style={{ background: 'var(--marine-surface)', border: `1px solid ${expanded === item.id ? 'var(--marine-gold)' : 'var(--marine-border)'}`, transition: 'border-color 0.2s' }}>
              <button onClick={() => toggle(item.id)} className="w-full flex items-center gap-4 p-4 text-left hover:brightness-110" style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>
                <span style={{ color: 'var(--marine-gold)', fontSize: 20, flexShrink: 0 }}>📄</span>
                <div className="flex-1 min-w-0">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <span className="text-xs" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace' }}>ORDER NO. {item.number}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1a3a1a', color: '#5aaa5a', fontFamily: 'Share Tech Mono, monospace', border: '1px solid #2a5a2a' }}>{item.status}</span>
                    {item.date && <span className="text-xs" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace' }}>{item.date}</span>}
                  </div>
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em', color: 'var(--marine-tan-light)', textTransform: 'uppercase' }}>{item.title}</div>
                </div>
                <div style={{ color: 'var(--marine-gold)', fontSize: 18, flexShrink: 0, transform: expanded === item.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
              </button>
              {expanded === item.id && (
                <div style={{ borderTop: '1px solid var(--marine-border)', background: 'rgba(0,0,0,0.2)' }}>
                  {item.image_url && (
                    <div style={{ width: '100%', height: 380, overflow: 'hidden' }}>
                      <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(15%) brightness(0.85)' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px' }}>
                    {item.summary && <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--marine-tan)' }}>{item.summary}</p>}
                    {item.document_url && (
                      <a href={item.document_url} target="_blank" rel="noopener noreferrer" className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--marine-gold)', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        📄 View Full Order ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Public Releases Section (Supabase) ─────────────────────── */

const TYPE_COLORS: Record<string, string> = {
  'PRESS RELEASE': '#2a4a5a',
  'OPERATIONAL REPORT': '#3a4a2a',
  'ANNOUNCEMENT': '#4a3a1a',
  'POLICY UPDATE': '#3a2a4a',
  'INTELLIGENCE BULLETIN': '#4a2a2a',
}

function ReleasesSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('releases').select('*').order('sort_order').then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <div>
      <SectionHeader title="Public Releases" subtitle="Official communications, press releases, and public documents — click to read" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="NO PUBLIC RELEASES ON FILE" /> : (
        <div>
          {items.map((item) => (
            <div key={item.id} className="rounded-lg mb-3 overflow-hidden" style={{ background: 'var(--marine-surface)', border: `1px solid ${expanded === item.id ? 'var(--marine-gold)' : 'var(--marine-border)'}`, transition: 'border-color 0.2s' }}>
              <button onClick={() => toggle(item.id)} className="w-full flex items-center gap-4 p-4 text-left hover:brightness-110" style={{ background: TYPE_COLORS[item.type] || '#2a3a2a', border: 'none', cursor: 'pointer', width: '100%' }}>
                <div className="flex-1 min-w-0">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span className="text-xs font-bold" style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--marine-tan-light)' }}>{item.type}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Share Tech Mono, monospace' }}>| {item.date}</span>
                  </div>
                  <div className="font-bold text-sm" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.07em', color: '#e8d8b0', textTransform: 'uppercase' }}>{item.title}</div>
                </div>
                <div style={{ color: 'rgba(232,216,176,0.7)', fontSize: 18, flexShrink: 0, transform: expanded === item.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
              </button>
              {expanded === item.id && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.3)', background: 'rgba(0,0,0,0.2)' }}>
                  {item.image_url && (
                    <div style={{ width: '100%', height: 380, overflow: 'hidden' }}>
                      <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(15%) brightness(0.85)' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px' }}>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--marine-tan)' }}>{item.description}</p>
                    {item.document_url && (
                      <a href={item.document_url} target="_blank" rel="noopener noreferrer" className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--marine-gold)', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        📄 Read Document ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Gallery Section (Supabase) ─────────────────────────────── */

function GallerySection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [lightbox, setLightbox] = useState<any | null>(null)

  useEffect(() => {
    supabase.from('gallery').select('*').order('sort_order').then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [])

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))]
  const filtered = filter === 'All' ? items : items.filter((i) => i.category === filter)

  return (
    <div>
      <SectionHeader title="Photo Gallery" subtitle="Official imagery and operational photography — click to enlarge" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="NO PHOTOS ON FILE" /> : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className="px-4 py-1.5 rounded text-xs font-bold transition-all"
                style={{
                  fontFamily: 'Oswald, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: filter === cat ? 'var(--marine-green)' : 'var(--marine-surface)',
                  color: filter === cat ? 'var(--marine-tan-light)' : 'var(--marine-tan-dark)',
                  border: filter === cat ? '1px solid var(--marine-gold)' : '1px solid var(--marine-border)',
                }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div key={item.id} className="group rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightbox(item)} style={{ background: 'var(--marine-surface)', border: '1px solid var(--marine-border)' }}>
                <div className="overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                  <img src={item.image_url} alt={item.caption}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{ filter: 'sepia(20%) contrast(1.1) brightness(0.9)' }} />
                  <div className="absolute top-3 right-3">
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.75)', color: 'var(--marine-gold)', fontFamily: 'Share Tech Mono, monospace' }}>{item.category}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <span style={{ color: 'white', fontSize: 32 }}>🔍</span>
                  </div>
                </div>
                <div className="p-3 text-sm" style={{ color: 'var(--marine-tan-dark)', fontFamily: 'Share Tech Mono, monospace', lineHeight: '1.5' }}>{item.caption}</div>
              </div>
            ))}
          </div>

          {/* Lightbox */}
          {lightbox && (
            <div
              onClick={() => setLightbox(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            >
              <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--marine-gold)', fontFamily: 'Share Tech Mono, monospace', fontSize: 12, letterSpacing: 1 }}>{lightbox.category}</span>
                  <button onClick={() => setLightbox(null)} style={{ background: 'transparent', border: '1px solid #3a5a3a', color: '#c8d8c0', width: 36, height: 36, borderRadius: 6, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
                </div>
                <img
                  src={lightbox.image_url}
                  alt={lightbox.caption}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8, border: '1px solid var(--marine-border)' }}
                />
                <div style={{ color: '#c8d8c0', fontFamily: 'Share Tech Mono, monospace', fontSize: 13, textAlign: 'center' }}>{lightbox.caption}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
