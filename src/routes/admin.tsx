import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/admin')({
  component: AdminPanel,
})

type Tab = 'leadership' | 'carousel' | 'releases' | 'treaties' | 'guidelines' | 'gallery' | 'users' | 'settings'

const C = {
  navy: '#1a2744', navyDark: '#0f1a30', gold: '#c9a84c',
  green: '#1a4a2a', greenLight: '#c8f0c8', red: '#3a1010',
  redBorder: '#6a2020', redText: '#f08080',
  card: '#0d1a2d', cardBorder: '#2a3a5a',
  input: '#071020', text: '#c8d8f0', muted: '#6a8aaa',
}

function useDragReorder<T extends { id: string; sort_order: number }>(items: T[], setItems: (i: T[]) => void, table: string) {
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)
  const onDragStart = (i: number) => { dragIdx.current = i }
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); dragOverIdx.current = i }
  const onDrop = async () => {
    if (dragIdx.current === null || dragOverIdx.current === null || dragIdx.current === dragOverIdx.current) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragIdx.current, 1)
    reordered.splice(dragOverIdx.current, 0, moved)
    const updated = reordered.map((item, i) => ({ ...item, sort_order: i }))
    setItems(updated)
    dragIdx.current = null; dragOverIdx.current = null
    for (const item of updated) await supabase.from(table).update({ sort_order: item.sort_order }).eq('id', item.id)
  }
  return { onDragStart, onDragOver, onDrop }
}

function AdminPanel() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('dos-admin') === 'true')
  const [role, setRole] = useState(() => sessionStorage.getItem('dos-admin-role') || 'User')
  const [username, setUsername] = useState('')
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('leadership')

  const login = async () => {
    if (!username || !pw) { setPwError('Please enter username and password.'); return }
    setLoading(true); setPwError('')
    const { data } = await supabase.from('admin_users').select('*').eq('email', username).eq('password_hash', pw).single()
    setLoading(false)
    if (data) {
      sessionStorage.setItem('dos-admin', 'true')
      sessionStorage.setItem('dos-admin-user', username)
      sessionStorage.setItem('dos-admin-role', data.role)
      setAuthed(true); setRole(data.role)
    } else { setPwError('Incorrect username or password.') }
  }

  const logout = () => {
    sessionStorage.removeItem('dos-admin')
    sessionStorage.removeItem('dos-admin-user')
    sessionStorage.removeItem('dos-admin-role')
    setAuthed(false); setRole('User'); setUsername(''); setPw('')
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: C.navyDark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 32, width: 360 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <img src="/dos-emblem.png" alt="DOS" style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${C.gold}` }} onError={e => { e.currentTarget.style.display = 'none' }} />
            <div>
              <div style={{ color: C.gold, fontFamily: 'Georgia, serif', fontSize: 18, letterSpacing: 2 }}>DOS ADMIN</div>
              <div style={{ color: C.muted, fontSize: 11 }}>Authorized personnel only</div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>USERNAME</label>
            <input type="text" value={username} onChange={e => { setUsername(e.target.value); setPwError('') }} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Enter username"
              style={{ width: '100%', background: C.input, border: `1px solid ${pwError ? '#aa4040' : C.cardBorder}`, borderRadius: 6, padding: '10px 12px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>PASSWORD</label>
            <input type="password" value={pw} onChange={e => { setPw(e.target.value); setPwError('') }} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Enter password"
              style={{ width: '100%', background: C.input, border: `1px solid ${pwError ? '#aa4040' : C.cardBorder}`, borderRadius: 6, padding: '10px 12px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {pwError && <div style={{ color: '#f08080', fontSize: 12, marginBottom: 10 }}>{pwError}</div>}
          <button onClick={login} disabled={loading} style={{ width: '100%', background: C.navy, color: C.gold, border: `1px solid ${C.gold}`, padding: 10, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    )
  }

  const isOwner = role === 'Owner' || role === 'God'
  const tabs: { id: Tab; label: string }[] = [
    { id: 'leadership', label: 'Leadership' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'releases', label: 'Public Releases' },
    { id: 'treaties', label: 'Treaties' },
    { id: 'guidelines', label: 'Guidelines' },
    { id: 'gallery', label: 'Gallery' },
    ...(isOwner ? [{ id: 'users' as Tab, label: 'Users' }] : []),
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.navyDark, color: C.text, fontFamily: 'sans-serif' }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.cardBorder}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: C.gold, fontSize: 16, fontWeight: 600, fontFamily: 'Georgia, serif', letterSpacing: 1 }}>DOS Admin</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: isOwner ? 'rgba(201,168,76,0.2)' : 'rgba(26,74,42,0.5)', color: isOwner ? C.gold : '#4a9a4a', border: `1px solid ${isOwner ? 'rgba(201,168,76,0.4)' : '#2a5a2a'}` }}>{role}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>← View Site</a>
          <button onClick={logout} style={{ background: 'transparent', border: `1px solid ${C.cardBorder}`, color: C.muted, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={{ display: 'flex', background: C.card, borderBottom: `1px solid ${C.cardBorder}`, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 18px', cursor: 'pointer', fontSize: 13, background: 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent', color: tab === t.id ? C.gold : C.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: 24 }}>
        {tab === 'leadership' && <LeadershipTab />}
        {tab === 'carousel' && <CarouselTab />}
        {tab === 'releases' && <ReleasesTab />}
        {tab === 'treaties' && <TreatiesTab />}
        {tab === 'guidelines' && <GuidelinesTab />}
        {tab === 'gallery' && <GalleryTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

const S = {
  card: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, marginBottom: 10 } as React.CSSProperties,
  row: { display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 } as React.CSSProperties,
  input: { width: '100%', background: C.input, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label: { fontSize: 12, color: C.muted, marginBottom: 5, display: 'block' } as React.CSSProperties,
  addBtn: { background: C.navy, color: C.gold, border: `1px solid ${C.gold}`, padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 } as React.CSSProperties,
  delBtn: { background: C.red, border: `1px solid ${C.redBorder}`, color: C.redText, width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, flexShrink: 0 } as React.CSSProperties,
  editBtn: { background: 'transparent', border: `1px solid ${C.cardBorder}`, color: C.muted, width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, flexShrink: 0 } as React.CSSProperties,
  submitBtn: { width: '100%', background: C.navy, color: C.gold, border: `1px solid ${C.gold}`, padding: 10, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 4 } as React.CSSProperties,
  cancelBtn: { width: '100%', background: 'transparent', border: `1px solid ${C.cardBorder}`, color: C.muted, padding: 10, borderRadius: 6, cursor: 'pointer', fontSize: 14, marginTop: 8 } as React.CSSProperties,
  sectionTitle: { fontSize: 20, fontWeight: 500, color: C.text } as React.CSSProperties,
  sectionSub: { fontSize: 13, color: C.muted, marginTop: 2 } as React.CSSProperties,
  formCard: { background: C.input, border: `1px dashed ${C.cardBorder}`, borderRadius: 8, padding: 16, marginBottom: 20 } as React.CSSProperties,
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 } as React.CSSProperties,
  modalBox: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' } as React.CSSProperties,
  dragHandle: { cursor: 'grab', color: C.muted, fontSize: 18, flexShrink: 0, userSelect: 'none' } as React.CSSProperties,
}

function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={S.label}>{label}</label>{children}</div>
}

function Modal({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: () => void; children: React.ReactNode }) {
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        {children}
        <button onClick={onSubmit} style={S.submitBtn}>Save</button>
        <button onClick={onClose} style={S.cancelBtn}>Cancel</button>
      </div>
    </div>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [])
  return <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a4a1a', border: '1px solid #3a7a3a', color: '#a0f0a0', padding: '10px 18px', borderRadius: 8, fontSize: 14, zIndex: 9999 }}>{msg}</div>
}

/* ─── Leadership Tab ─────────────────────────────────────────── */
function LeadershipTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ username: '', title: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'leadership')

  const load = async () => { const { data } = await supabase.from('leadership').select('*').order('sort_order'); setItems(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ username: '', title: '', image_url: '' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ username: item.username, title: item.title, image_url: item.image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.username || !form.title) return
    if (editItem) { await supabase.from('leadership').update({ username: form.username, title: form.title, image_url: form.image_url || null }).eq('id', editItem.id) }
    else { await supabase.from('leadership').insert({ username: form.username, title: form.title, image_url: form.image_url || null, sort_order: items.length }) }
    setToast(editItem ? 'Updated!' : 'Added!'); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('leadership').delete().eq('id', id); setToast('Deleted.'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><div style={S.sectionTitle}>Leadership</div><div style={S.sectionSub}>Manage leadership members</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Leader</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ width: 44, height: 44, borderRadius: 6, background: C.navy, border: `1px solid ${C.cardBorder}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold, fontSize: 11 }}>
              {item.image_url ? <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.username.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.username}</div>
              <div style={{ fontSize: 12, color: C.gold, marginTop: 2 }}>{item.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Leader' : 'Add Leader'} onClose={() => setModal(false)} onSubmit={save}>
          <FG label="Username"><input style={S.input} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g., Ambassador_Smith" /></FG>
          <FG label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Secretary of State" /></FG>
          <FG label="Profile Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FG>
        </Modal>
      )}
    </div>
  )
}

/* ─── Carousel Tab ───────────────────────────────────────────── */
function CarouselTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ image_url: '', caption: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'carousel')

  const load = async () => { const { data } = await supabase.from('carousel').select('*').order('sort_order'); setItems(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ image_url: '', caption: '' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ image_url: item.image_url, caption: item.caption || '' }); setModal(true) }

  const save = async () => {
    if (!form.image_url) return
    if (editItem) { await supabase.from('carousel').update({ image_url: form.image_url, caption: form.caption }).eq('id', editItem.id) }
    else { await supabase.from('carousel').insert({ image_url: form.image_url, caption: form.caption, sort_order: items.length }) }
    setToast(editItem ? 'Updated!' : 'Added!'); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('carousel').delete().eq('id', id); setToast('Deleted.'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><div style={S.sectionTitle}>Carousel Images</div><div style={S.sectionSub}>Manage homepage carousel</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Image</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ width: 64, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: C.navy }}>
              <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <div style={{ flex: 1, fontSize: 14, color: C.text }}>{item.caption || item.image_url}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Image' : 'Add Image'} onClose={() => setModal(false)} onSubmit={save}>
          <FG label="Image URL"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FG>
          <FG label="Caption (optional)"><input style={S.input} value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Image caption..." /></FG>
        </Modal>
      )}
    </div>
  )
}

/* ─── Releases Tab ───────────────────────────────────────────── */
function ReleasesTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ type: 'PRESS RELEASE', title: '', description: '', date: '', document_url: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'releases')

  const load = async () => { const { data } = await supabase.from('releases').select('*').order('sort_order'); setItems(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ type: 'PRESS RELEASE', title: '', description: '', date: new Date().getFullYear().toString(), document_url: '', image_url: '' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ type: item.type, title: item.title, description: item.description, date: item.date, document_url: item.document_url || '', image_url: item.image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.title || !form.description) return
    const payload = { type: form.type, title: form.title, description: form.description, date: form.date, document_url: form.document_url || null, image_url: form.image_url || null }
    if (editItem) { await supabase.from('releases').update(payload).eq('id', editItem.id) }
    else { await supabase.from('releases').insert({ ...payload, sort_order: items.length }) }
    setToast(editItem ? 'Updated!' : 'Added!'); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('releases').delete().eq('id', id); setToast('Deleted.'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><div style={S.sectionTitle}>Public Releases</div><div style={S.sectionSub}>Manage press releases</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Release</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: '#1a3a6a', color: '#a0c0f0', border: '1px solid #2a5a9a' }}>{item.type}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{item.date}</span>
              </div>
              <div style={{ fontSize: 14, color: C.text }}>{item.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Release' : 'Add Release'} onClose={() => setModal(false)} onSubmit={save}>
          <FG label="Type"><select style={S.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option>PRESS RELEASE</option><option>DIPLOMATIC CABLE</option><option>STATEMENT</option><option>TREATY NOTICE</option><option>ANNOUNCEMENT</option></select></FG>
          <FG label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Release title" /></FG>
          <FG label="Description"><textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FG>
          <FG label="Date"><input style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="2026" /></FG>
          <FG label="Cover Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FG>
          <FG label="Document URL (optional)"><input style={S.input} value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} placeholder="https://..." /></FG>
        </Modal>
      )}
    </div>
  )
}

/* ─── Treaties Tab ───────────────────────────────────────────── */
function TreatiesTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ number: '', title: '', content: '', document_url: '', image_url: '', date: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'treaties')

  const load = async () => { const { data } = await supabase.from('treaties').select('*').order('sort_order'); setItems(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ number: '', title: '', content: '', document_url: '', image_url: '', date: '' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ number: String(item.number), title: item.title, content: item.content || '', document_url: item.document_url || '', image_url: item.image_url || '', date: item.date || '' }); setModal(true) }

  const save = async () => {
    if (!form.title) return
    const payload = { number: parseInt(form.number) || items.length + 1, title: form.title, content: form.content, document_url: form.document_url || null, image_url: form.image_url || null, date: form.date }
    if (editItem) { await supabase.from('treaties').update(payload).eq('id', editItem.id) }
    else { await supabase.from('treaties').insert({ ...payload, sort_order: items.length }) }
    setToast(editItem ? 'Updated!' : 'Added!'); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('treaties').delete().eq('id', id); setToast('Deleted.'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><div style={S.sectionTitle}>Treaty Archives</div><div style={S.sectionSub}>Manage treaties and agreements</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Treaty</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <span style={{ fontSize: 18, color: C.gold, flexShrink: 0 }}>📜</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: C.text }}>Treaty No. {item.number}: {item.title}</div>
              {item.date && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.date}</div>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Treaty' : 'Add Treaty'} onClose={() => setModal(false)} onSubmit={save}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FG label="Treaty Number"><input style={S.input} type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder={`${items.length + 1}`} /></FG>
            <FG label="Date"><input style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="April 2026" /></FG>
          </div>
          <FG label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Treaty title" /></FG>
          <FG label="Full Content"><textarea style={{ ...S.input, minHeight: 120, resize: 'vertical' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Treaty content... (supports **bold**)" /></FG>
          <FG label="Cover Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FG>
          <FG label="Document URL (optional)"><input style={S.input} value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} placeholder="https://drive.google.com/..." /></FG>
        </Modal>
      )}
    </div>
  )
}

/* ─── Guidelines Tab ─────────────────────────────────────────── */
function GuidelinesTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ number: '', title: '', content: '', document_url: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'guidelines')

  const load = async () => { const { data } = await supabase.from('guidelines').select('*').order('sort_order'); setItems(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ number: '', title: '', content: '', document_url: '', image_url: '' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ number: String(item.number), title: item.title, content: item.content || '', document_url: item.document_url || '', image_url: item.image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.title) return
    const payload = { number: parseInt(form.number) || items.length + 1, title: form.title, content: form.content, document_url: form.document_url || null, image_url: form.image_url || null }
    if (editItem) { await supabase.from('guidelines').update(payload).eq('id', editItem.id) }
    else { await supabase.from('guidelines').insert({ ...payload, sort_order: items.length }) }
    setToast(editItem ? 'Updated!' : 'Added!'); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('guidelines').delete().eq('id', id); setToast('Deleted.'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><div style={S.sectionTitle}>Diplomatic Guidelines</div><div style={S.sectionSub}>Manage guidelines and protocols</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Guideline</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <span style={{ fontSize: 18, color: '#6a8aaa', flexShrink: 0 }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: C.text }}>Guideline No. {item.number}: {item.title}</div>
              {item.content && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.content.slice(0, 60)}...</div>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Guideline' : 'Add Guideline'} onClose={() => setModal(false)} onSubmit={save}>
          <FG label="Guideline Number"><input style={S.input} type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder={`${items.length + 1}`} /></FG>
          <FG label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Guideline title" /></FG>
          <FG label="Full Content"><textarea style={{ ...S.input, minHeight: 120, resize: 'vertical' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Guideline content... (supports **bold**)" /></FG>
          <FG label="Cover Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FG>
          <FG label="Document URL (optional)"><input style={S.input} value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} placeholder="https://drive.google.com/..." /></FG>
        </Modal>
      )}
    </div>
  )
}

/* ─── Gallery Tab ────────────────────────────────────────────── */
function GalleryTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ image_url: '', caption: '', category: 'General' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'gallery')

  const load = async () => { const { data } = await supabase.from('gallery').select('*').order('sort_order'); setItems(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ image_url: '', caption: '', category: 'General' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ image_url: item.image_url, caption: item.caption, category: item.category }); setModal(true) }

  const save = async () => {
    if (!form.image_url || !form.caption) return
    if (editItem) { await supabase.from('gallery').update({ image_url: form.image_url, caption: form.caption, category: form.category }).eq('id', editItem.id) }
    else { await supabase.from('gallery').insert({ image_url: form.image_url, caption: form.caption, category: form.category, sort_order: items.length }) }
    setToast(editItem ? 'Updated!' : 'Added!'); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('gallery').delete().eq('id', id); setToast('Deleted.'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><div style={S.sectionTitle}>Photo Gallery</div><div style={S.sectionSub}>Manage gallery images</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Photo</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ width: 64, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: C.text }}>{item.caption}</div>
              <div style={{ fontSize: 12, color: C.gold }}>{item.category}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Photo' : 'Add Photo'} onClose={() => setModal(false)} onSubmit={save}>
          <FG label="Image URL"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FG>
          <FG label="Caption"><input style={S.input} value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Photo caption..." /></FG>
          <FG label="Category"><select style={S.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}><option>General</option><option>Diplomacy</option><option>Events</option><option>Personnel</option><option>Operations</option></select></FG>
        </Modal>
      )}
    </div>
  )
}

/* ─── Users Tab ──────────────────────────────────────────────── */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', role: 'User' })
  const [toast, setToast] = useState('')

  const load = async () => { const { data } = await supabase.from('admin_users').select('id, email, role, created_at').order('created_at'); setUsers(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.email || !form.password) return
    await supabase.from('admin_users').insert({ email: form.email, password_hash: form.password, role: form.role })
    setToast('User created!'); setForm({ email: '', password: '', role: 'User' }); load()
  }

  const del = async (id: string) => { if (!confirm('Delete this user?')) return; await supabase.from('admin_users').delete().eq('id', id); setToast('Deleted.'); load() }
  const updateRole = async (id: string, role: string) => { await supabase.from('admin_users').update({ role }).eq('id', id); setToast('Role updated!'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionTitle}>Users</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, marginTop: 2 }}>Manage admin access</div>
      <div style={S.formCard}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginBottom: 12 }}>+ Create New User</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <input style={S.input} placeholder="Username" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input style={S.input} placeholder="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{ ...S.input, width: 140 }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option>User</option><option>Admin</option><option>Owner</option></select>
          <button style={{ ...S.addBtn, flex: 1 }} onClick={create}>Create User</button>
        </div>
      </div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : users.map(user => (
        <div key={user.id} style={S.card}>
          <div style={S.row}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.navy, border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.gold, flexShrink: 0 }}>{user.email.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.text }}>{user.email}</div>
              <div style={{ fontSize: 11, color: C.muted }}>Added: {new Date(user.created_at).toLocaleDateString()}</div>
            </div>
            <select value={user.role} onChange={e => updateRole(user.id, e.target.value)} style={{ ...S.input, width: 100, marginRight: 8 }}><option>User</option><option>Admin</option><option>Owner</option></select>
            <button style={S.delBtn} onClick={() => del(user.id)}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Settings Tab ───────────────────────────────────────────── */
function SettingsTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ key: '', value: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [toast, setToast] = useState('')

  const load = async () => { const { data } = await supabase.from('settings').select('*').order('key'); setItems(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const create = async () => { if (!form.key || !form.value) return; await supabase.from('settings').upsert({ key: form.key, value: form.value }); setToast('Saved!'); setForm({ key: '', value: '' }); load() }
  const saveEdit = async (id: string) => { await supabase.from('settings').update({ value: editVal }).eq('id', id); setToast('Updated!'); setEditId(null); load() }
  const del = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('settings').delete().eq('id', id); setToast('Deleted.'); load() }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionTitle}>Settings</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, marginTop: 2 }}>Manage site configuration</div>
      <div style={S.formCard}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginBottom: 12 }}>Add New Setting</div>
        <input style={{ ...S.input, marginBottom: 8 }} placeholder="Key (e.g., discord_url)" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} />
        <input style={{ ...S.input, marginBottom: 10 }} placeholder="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
        <button style={S.addBtn} onClick={create}>Create</button>
      </div>
      {loading ? <div style={{ color: C.muted }}>Loading...</div> : items.map(item => (
        <div key={item.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.key}</div>
            {editId === item.id
              ? <input style={{ ...S.input, marginTop: 6 }} value={editVal} onChange={e => setEditVal(e.target.value)} />
              : <div style={{ fontSize: 12, color: C.gold, marginTop: 3, wordBreak: 'break-all' }}>{item.value}</div>
            }
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {editId === item.id
              ? <button onClick={() => saveEdit(item.id)} style={{ background: '#1a4a1a', border: '1px solid #2a6a2a', color: '#4af04a', padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Save</button>
              : <button onClick={() => { setEditId(item.id); setEditVal(item.value) }} style={{ background: C.navy, border: `1px solid ${C.cardBorder}`, color: C.gold, padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Edit</button>
            }
            <button onClick={() => del(item.id)} style={{ background: C.red, border: `1px solid ${C.redBorder}`, color: C.redText, padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
