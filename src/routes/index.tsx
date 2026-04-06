import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/')({
  component: DOSHome,
})

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'releases', label: 'Public Releases' },
  { id: 'treaties', label: 'Treaty Archives' },
  { id: 'guidelines', label: 'Diplomatic Guidelines' },
  { id: 'gallery', label: 'Photo Gallery' },
] as const

type TabId = (typeof TABS)[number]['id']

/* ─── CSS Variables ──────────────────────────────────────────── */
const C = {
  navy: '#1a2744',
  navyDark: '#0f1a30',
  navyLight: '#243358',
  blue: '#2c5282',
  blueLight: '#3182ce',
  gold: '#c9a84c',
  white: '#ffffff',
  offWhite: '#f7f9fc',
  lightGray: '#e8edf5',
  gray: '#718096',
  darkGray: '#2d3748',
  border: '#d1dce8',
  text: '#1a202c',
  textMuted: '#4a5568',
}

/* ─── Carousel ───────────────────────────────────────────────── */
function HomeCarousel() {
  const [slides, setSlides] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.from('carousel').select('*').order('sort_order').then(({ data }) => setSlides(data || []))
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % slides.length), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [slides.length])

  if (slides.length === 0) return null

  return (
    <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden', background: C.navyDark }}>
      {slides.map((slide, i) => (
        <div key={slide.id} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          <img src={slide.image_url} alt={slide.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }} />
          {slide.caption && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 32px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
              <span style={{ color: C.white, fontSize: 14, letterSpacing: 1 }}>{slide.caption}</span>
            </div>
          )}
        </div>
      ))}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.gold }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: C.gold }} />
      {slides.length > 1 && (
        <>
          <button onClick={() => setCurrent(c => (c - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(201,168,76,0.4)`, color: C.white, width: 36, height: 36, borderRadius: 4, cursor: 'pointer', fontSize: 16 }}>‹</button>
          <button onClick={() => setCurrent(c => (c + 1) % slides.length)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(201,168,76,0.4)`, color: C.white, width: 36, height: 36, borderRadius: 4, cursor: 'pointer', fontSize: 16 }}>›</button>
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 20 : 8, height: 8, borderRadius: 4, background: i === current ? C.gold : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
            ))}
          </div>
        </>
      )}
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
    <footer style={{ background: C.navyDark, borderTop: `4px solid ${C.gold}`, color: C.lightGray, fontFamily: 'sans-serif' }}>
      {(settings.discord_url || settings.roblox_community_url || settings.roblox_game_url) && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 24, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
          {settings.discord_url && <a href={settings.discord_url} target="_blank" rel="noopener noreferrer" style={{ color: C.lightGray, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>💬 Discord Server</a>}
          {settings.roblox_community_url && <a href={settings.roblox_community_url} target="_blank" rel="noopener noreferrer" style={{ color: C.lightGray, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>👥 Roblox Community</a>}
          {settings.roblox_game_url && <a href={settings.roblox_game_url} target="_blank" rel="noopener noreferrer" style={{ color: C.lightGray, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>🎮 Roblox Game</a>}
        </div>
      )}
      <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: 12, opacity: 0.6 }}>
        OSFUSA — DEPARTMENT OF STATE &nbsp;|&nbsp; ROBLOX RP &nbsp;|&nbsp; MADE BY GREYHOLIC
        &nbsp;|&nbsp;
        <a href="/admin" style={{ color: C.lightGray, textDecoration: 'none', opacity: 0.7 }}
          onMouseOver={e => (e.currentTarget.style.opacity = '1')}
          onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}>
          Admin Login
        </a>
      </div>
    </footer>
  )
}

/* ─── Shared Components ──────────────────────────────────────── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: `2px solid ${C.gold}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 4, height: 32, background: C.gold, borderRadius: 2 }} />
        <h2 style={{ fontSize: 28, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
      </div>
      {subtitle && <p style={{ marginLeft: 16, fontSize: 14, color: C.textMuted, margin: '4px 0 0 16px' }}>{subtitle}</p>}
    </div>
  )
}

function LoadingState() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: C.gray, fontSize: 13, letterSpacing: 2 }}>LOADING...</div>
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', background: C.offWhite, border: `1px solid ${C.border}`, borderRadius: 8 }}>
      <p style={{ color: C.gray, fontSize: 13 }}>{message}</p>
    </div>
  )
}

/* ─── Main Layout ────────────────────────────────────────────── */
function DOSHome() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.offWhite, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 100%)`, borderBottom: `4px solid ${C.gold}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.gold}`, flexShrink: 0 }}>
              <img src="/dos-emblem.png" alt="DOS" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: C.gold, textTransform: 'uppercase' }}>OSFUSA ROBLOX RP</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: C.white, margin: '2px 0', fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>Department of State</h1>
              <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(201,168,76,0.7)' }}>DIPLOMATIC SERVICE</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'none' }} className="md-show">MADE BY GREYHOLIC</span>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.3)`, color: C.white, padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: C.navy, borderBottom: `1px solid ${C.navyLight}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '12px 20px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: 'transparent', border: 'none', whiteSpace: 'nowrap',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: activeTab === tab.id ? C.gold : 'rgba(255,255,255,0.6)',
                borderBottom: activeTab === tab.id ? `3px solid ${C.gold}` : '3px solid transparent',
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </nav>

      {/* Carousel */}
      {activeTab === 'overview' && <HomeCarousel />}

      {/* Content */}
      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'leadership' && <LeadershipSection />}
        {activeTab === 'releases' && <ReleasesSection />}
        {activeTab === 'treaties' && <TreatiesSection />}
        {activeTab === 'guidelines' && <GuidelinesSection />}
        {activeTab === 'gallery' && <GallerySection />}
      </main>

      <SiteFooter />
    </div>
  )
}

/* ─── Overview Section ───────────────────────────────────────── */
function OverviewSection() {
  const blocks = [
    { heading: 'About the Department of State', text: 'The OSFUSA Department of State serves as the primary foreign affairs agency of the OSFUSA government within the Roblox RP environment. The Department is responsible for advising the President on international relations, negotiating treaties, and representing OSFUSA interests on the world stage.' },
    { heading: 'Mission Statement', text: 'To shape and sustain a peaceful, prosperous, just, and democratic world, and foster conditions for stability and progress for the benefit of the American people and people everywhere. The Department leads America\'s foreign policy through diplomacy, advocacy, and assistance by advancing the interests of the American people.' },
    { heading: 'Diplomatic Security Service (DSS)', text: 'The Diplomatic Security Service is the security and law enforcement arm of the Department of State. DSS special agents protect the Secretary of State, U.S. Ambassadors, and high-ranking foreign dignitaries. They also investigate passport and visa fraud, and maintain security at diplomatic missions.' },
    { heading: 'Core Values', text: 'Excellence · Integrity · Service\n\nEvery diplomat and officer of the Department is expected to uphold these core values in all their interactions, whether in negotiations, public service, or internal operations.' },
    { heading: 'Organizational Structure', text: 'The Department is led by the Secretary of State, appointed by the President and confirmed by the Senate. The Secretary is supported by Deputy Secretaries, Under Secretaries, and a network of Ambassadors and diplomatic staff stationed across OSFUSA\'s allied territories.' },
  ]

  const quickFacts = [
    { label: 'AGENCY', value: 'Dept. of State' },
    { label: 'FOUNDED', value: 'OSFUSA Era' },
    { label: 'PLATFORM', value: 'Roblox RP' },
    { label: 'STATUS', value: 'Active' },
    { label: 'GROUP', value: 'OSFUSA' },
    { label: 'MOTTO', value: 'Diplomacy First' },
  ]

  return (
    <div>
      <SectionHeader title="Overview" subtitle="OSFUSA Department of State — General Information" />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          {blocks.map(block => (
            <div key={block.heading} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{block.heading}</h3>
              {block.text.split('\n\n').map((p, i) => (
                <p key={i} style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: i > 0 ? '8px 0 0' : 0 }}>{p}</p>
              ))}
            </div>
          ))}
        </div>
        <div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Quick Facts</h3>
            {quickFacts.map(fact => (
              <div key={fact.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.lightGray}` }}>
                <span style={{ fontSize: 11, color: C.gray, letterSpacing: 1 }}>{fact.label}</span>
                <span style={{ fontSize: 11, color: C.darkGray, fontWeight: 600 }}>{fact.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.navy, border: `1px solid ${C.navyLight}`, borderRadius: 8, padding: 20, textAlign: 'center' }}>
            <img src="/dos-emblem.png" alt="DOS Emblem" style={{ width: '80%', objectFit: 'contain', margin: '0 auto' }} onError={e => { e.currentTarget.style.display = 'none' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8, letterSpacing: 1 }}>U.S. DEPT. OF STATE — OSFUSA</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Leadership Section ─────────────────────────────────────── */
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
      <SectionHeader title="Leadership" subtitle="Department of State — Senior Officials & Diplomatic Staff" />
      {loading ? <LoadingState /> : members.length === 0 ? <EmptyState message="No leadership records on file." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {members.map((member, i) => {
            const isSecretary = member.title?.toLowerCase().includes('secretary of state') && !member.title?.toLowerCase().includes('deputy') && !member.title?.toLowerCase().includes('under')
            return (
              <div key={member.id} style={{ background: C.white, border: `1px solid ${isSecretary ? C.gold : C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: 180, overflow: 'hidden', background: C.lightGray, position: 'relative' }}>
                  {member.image_url
                    ? <img src={member.image_url} alt={member.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: C.navy }}>{member.username.slice(0, 2).toUpperCase()}</div>
                  }
                  {isSecretary && (
                    <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 4, background: C.gold, color: C.navyDark, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>SECRETARY</div>
                  )}
                </div>
                <div style={{ padding: 16, borderTop: `2px solid ${isSecretary ? C.gold : C.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isSecretary ? C.blue : C.darkGray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{member.username}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{member.title}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Expandable card helper ─────────────────────────────────── */
function ExpandCard({ id, expanded, onToggle, header, children }: { id: string; expanded: string | null; onToggle: (id: string) => void; header: React.ReactNode; children: React.ReactNode }) {
  const isOpen = expanded === id
  return (
    <div style={{ background: C.white, border: `1px solid ${isOpen ? C.blue : C.border}`, borderRadius: 8, marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={() => onToggle(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        {header}
        <div style={{ marginLeft: 'auto', color: C.blue, fontSize: 18, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
      </button>
      {isOpen && (
        <div style={{ borderTop: `1px solid ${C.border}`, background: C.offWhite }}>
          {children}
        </div>
      )}
    </div>
  )
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return <p key={i} style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 6 }}>{parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}</p>
  })
}

/* ─── Public Releases Section ────────────────────────────────── */
const TYPE_COLORS: Record<string, string> = {
  'PRESS RELEASE': '#2a4a8a',
  'DIPLOMATIC CABLE': '#1a5a3a',
  'STATEMENT': '#6a3a1a',
  'TREATY NOTICE': '#4a1a6a',
  'ANNOUNCEMENT': '#1a4a6a',
}

function ReleasesSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const toggle = (id: string) => setExpanded(p => p === id ? null : id)

  useEffect(() => {
    supabase.from('releases').select('*').order('sort_order').then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <SectionHeader title="Public Releases" subtitle="Official communications and press releases from the Department of State" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="No public releases on file." /> : items.map(item => (
        <ExpandCard key={item.id} id={item.id} expanded={expanded} onToggle={toggle} header={
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: TYPE_COLORS[item.type] || '#2a4a8a', color: '#fff', letterSpacing: 1 }}>{item.type}</span>
              <span style={{ fontSize: 11, color: C.gray }}>{item.date}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGray }}>{item.title}</div>
          </div>
        }>
          {item.image_url && <div style={{ height: 380, overflow: 'hidden' }}><img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 12 }}>{item.description}</p>
            {item.document_url && <a href={item.document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'none', fontWeight: 600 }}>📄 Read Full Document ↗</a>}
          </div>
        </ExpandCard>
      ))}
    </div>
  )
}

/* ─── Treaty Archives Section ────────────────────────────────── */
function TreatiesSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const toggle = (id: string) => setExpanded(p => p === id ? null : id)

  useEffect(() => {
    supabase.from('treaties').select('*').order('sort_order').then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <SectionHeader title="Treaty Archives" subtitle="Official treaties, agreements, and international accords — click to read" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="No treaties on file." /> : items.map(item => (
        <ExpandCard key={item.id} id={item.id} expanded={expanded} onToggle={toggle} header={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, color: C.gold }}>📜</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGray }}>Treaty No. {item.number}: {item.title}</div>
              {item.date && <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{item.date}</div>}
            </div>
          </div>
        }>
          {item.image_url && <div style={{ height: 380, overflow: 'hidden' }}><img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div style={{ padding: 20 }}>
            {item.content ? <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{renderContent(item.content)}</div> : <p style={{ color: C.gray, fontStyle: 'italic' }}>No content available.</p>}
            {item.document_url && <a href={item.document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: 12 }}>📄 View Full Document ↗</a>}
          </div>
        </ExpandCard>
      ))}
    </div>
  )
}

/* ─── Diplomatic Guidelines Section ─────────────────────────── */
function GuidelinesSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const toggle = (id: string) => setExpanded(p => p === id ? null : id)

  useEffect(() => {
    supabase.from('guidelines').select('*').order('sort_order').then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <SectionHeader title="Diplomatic Guidelines" subtitle="Official protocols, procedures, and diplomatic standards — click to read" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="No guidelines on file." /> : items.map(item => (
        <ExpandCard key={item.id} id={item.id} expanded={expanded} onToggle={toggle} header={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, color: C.blue }}>📋</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGray }}>Guideline No. {item.number}: {item.title}</div>
          </div>
        }>
          {item.image_url && <div style={{ height: 380, overflow: 'hidden' }}><img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div style={{ padding: 20 }}>
            {item.content ? <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{renderContent(item.content)}</div> : <p style={{ color: C.gray, fontStyle: 'italic' }}>No content available.</p>}
            {item.document_url && <a href={item.document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: 12 }}>📄 View Full Document ↗</a>}
          </div>
        </ExpandCard>
      ))}
    </div>
  )
}

/* ─── Gallery Section ────────────────────────────────────────── */
function GallerySection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [lightbox, setLightbox] = useState<any | null>(null)

  useEffect(() => {
    supabase.from('gallery').select('*').order('sort_order').then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [])

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))]
  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter)

  return (
    <div>
      <SectionHeader title="Photo Gallery" subtitle="Official imagery and diplomatic photography — click to enlarge" />
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState message="No photos on file." /> : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: '6px 16px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: filter === cat ? C.navy : C.white,
                color: filter === cat ? C.white : C.textMuted,
                border: `1px solid ${filter === cat ? C.navy : C.border}`,
              }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(item => (
              <div key={item.id} onClick={() => setLightbox(item)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = C.blue)}
                onMouseOut={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                  <img src={item.image_url} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')} />
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: C.white, fontSize: 10, padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>{item.category}</div>
                </div>
                <div style={{ padding: '10px 12px', fontSize: 12, color: C.textMuted }}>{item.caption}</div>
              </div>
            ))}
          </div>
          {lightbox && (
            <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: C.gold, fontSize: 12, letterSpacing: 1 }}>{lightbox.category}</span>
                  <button onClick={() => setLightbox(null)} style={{ background: 'transparent', border: `1px solid rgba(255,255,255,0.3)`, color: C.white, width: 36, height: 36, borderRadius: 6, cursor: 'pointer', fontSize: 20 }}>×</button>
                </div>
                <img src={lightbox.image_url} alt={lightbox.caption} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />
                <div style={{ color: C.white, fontSize: 13, textAlign: 'center' }}>{lightbox.caption}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
