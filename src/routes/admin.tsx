import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Leadership, Announcement, Regulation, StandingOrder, Release, GalleryItem, Setting, AdminUser } from '../lib/supabase'

export const Route = createFileRoute('/admin')({
  component: AdminPanel,
})

type Tab = 'leadership' | 'carousel' | 'announcements' | 'divisions' | 'regulations' | 'orders' | 'releases' | 'gallery' | 'users' | 'settings'

/* ─── Drag Hook ──────────────────────────────────────────────── */

function useDragReorder<T extends { id: string; sort_order: number }>(
  items: T[],
  setItems: (items: T[]) => void,
  table: string
) {
  const dragIdx = useRef<number | null>(null)
  const dragOverIdx = useRef<number | null>(null)

  const onDragStart = (i: number) => { dragIdx.current = i }
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); dragOverIdx.current = i }

  const onDrop = async () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return
    if (dragIdx.current === dragOverIdx.current) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragIdx.current, 1)
    reordered.splice(dragOverIdx.current, 0, moved)
    const updated = reordered.map((item, i) => ({ ...item, sort_order: i }))
    setItems(updated)
    dragIdx.current = null
    dragOverIdx.current = null
    for (const item of updated) {
      await supabase.from(table).update({ sort_order: item.sort_order }).eq('id', item.id)
    }
  }

  return { onDragStart, onDragOver, onDrop }
}

/* ─── Admin Panel ────────────────────────────────────────────── */

function AdminPanel() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('usmc-admin') === 'true')
  const [role, setRole] = useState(() => sessionStorage.getItem('usmc-admin-role') || 'User')
  const [username, setUsername] = useState('')
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('leadership')

  const login = async () => {
    if (!username || !pw) { setPwError('Please enter username and password.'); return }
    setLoading(true)
    setPwError('')
    const { data } = await supabase.from('admin_users').select('*').eq('email', username).eq('password_hash', pw).single()
    setLoading(false)
    if (data) {
      sessionStorage.setItem('usmc-admin', 'true')
      sessionStorage.setItem('usmc-admin-user', username)
      sessionStorage.setItem('usmc-admin-role', data.role)
      setAuthed(true)
      setRole(data.role)
    } else {
      setPwError('Incorrect username or password.')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('usmc-admin')
    sessionStorage.removeItem('usmc-admin-user')
    sessionStorage.removeItem('usmc-admin-role')
    setAuthed(false)
    setRole('User')
    setUsername('')
    setPw('')
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#0d1f0d', border: '1px solid #2a4a2a', borderRadius: 10, padding: 32, width: 360 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <img src="/usmc-emblem.png" alt="USMC" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #4a9a4a' }} />
            <div>
              <div style={{ color: '#4a9a4a', fontFamily: 'Oswald, sans-serif', fontSize: 18, letterSpacing: 2 }}>USMC ADMIN</div>
              <div style={{ color: '#6a8a6a', fontSize: 11 }}>Authorized personnel only</div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#8aaa8a', display: 'block', marginBottom: 4 }}>USERNAME</label>
            <input type="text" placeholder="Enter username" value={username}
              onChange={e => { setUsername(e.target.value); setPwError('') }}
              onKeyDown={e => e.key === 'Enter' && login()}
              style={{ width: '100%', background: '#071407', border: `1px solid ${pwError ? '#aa4040' : '#2a4a2a'}`, borderRadius: 6, padding: '10px 12px', color: '#c8d8c0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#8aaa8a', display: 'block', marginBottom: 4 }}>PASSWORD</label>
            <input type="password" placeholder="Enter password" value={pw}
              onChange={e => { setPw(e.target.value); setPwError('') }}
              onKeyDown={e => e.key === 'Enter' && login()}
              style={{ width: '100%', background: '#071407', border: `1px solid ${pwError ? '#aa4040' : '#2a4a2a'}`, borderRadius: 6, padding: '10px 12px', color: '#c8d8c0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {pwError && <div style={{ color: '#f08080', fontSize: 12, marginBottom: 10 }}>{pwError}</div>}
          <button onClick={login} disabled={loading} style={{ width: '100%', background: '#2a6a2a', color: '#c8f0c8', border: 'none', padding: '10px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
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
    { id: 'announcements', label: 'Announcements' },
    { id: 'divisions', label: 'Divisions' },
    { id: 'regulations', label: 'Regulations' },
    { id: 'orders', label: 'Standing Orders' },
    { id: 'releases', label: 'Public Releases' },
    { id: 'gallery', label: 'Gallery' },
    ...(isOwner ? [{ id: 'users' as Tab, label: 'Users' }] : []),
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a1a0a', color: '#c8d8c0', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0d1f0d', borderBottom: '1px solid #2a4a2a', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#4a9a4a', fontSize: 16, fontWeight: 500, letterSpacing: 1, fontFamily: 'Oswald, sans-serif' }}>USMC Admin</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: isOwner ? 'rgba(180,140,40,0.2)' : '#1a3a1a', color: isOwner ? 'var(--marine-gold, #b8a030)' : '#4a9a4a', border: `1px solid ${isOwner ? 'rgba(180,140,40,0.4)' : '#2a5a2a'}` }}>{role}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" style={{ color: '#6a8a6a', fontSize: 13, textDecoration: 'none' }}>← View Site</a>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #3a5a3a', color: '#8aaa8a', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={{ display: 'flex', background: '#0d1f0d', borderBottom: '1px solid #2a4a2a', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 18px', cursor: 'pointer', fontSize: 13, background: 'transparent', border: 'none',
            borderBottom: tab === t.id ? '2px solid #4a9a4a' : '2px solid transparent',
            color: tab === t.id ? '#4a9a4a' : '#6a8a6a', whiteSpace: 'nowrap', flexShrink: 0
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: 24 }}>
        {tab === 'leadership' && <LeadershipTab />}
        {tab === 'carousel' && <CarouselTab />}
        {tab === 'announcements' && <AnnouncementsTab />}
        {tab === 'divisions' && <DivisionsTab />}
        {tab === 'regulations' && <RegulationsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'releases' && <ReleasesTab />}
        {tab === 'gallery' && <GalleryTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

/* ─── Shared ─────────────────────────────────────────────────── */

const S = {
  card: { background: '#0d1f0d', border: '1px solid #2a4a2a', borderRadius: 8, marginBottom: 10 } as React.CSSProperties,
  row: { display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 } as React.CSSProperties,
  input: { width: '100%', background: '#071407', border: '1px solid #2a4a2a', borderRadius: 6, padding: '8px 12px', color: '#c8d8c0', fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label: { fontSize: 12, color: '#8aaa8a', marginBottom: 5, display: 'block' } as React.CSSProperties,
  addBtn: { background: '#2a6a2a', color: '#c8f0c8', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
  delBtn: { background: '#3a1010', border: '1px solid #6a2020', color: '#f08080', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, flexShrink: 0 } as React.CSSProperties,
  editBtn: { background: 'transparent', border: '1px solid #3a5a3a', color: '#8aaa8a', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 14, flexShrink: 0 } as React.CSSProperties,
  submitBtn: { width: '100%', background: '#2a6a2a', color: '#c8f0c8', border: 'none', padding: 10, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 4 } as React.CSSProperties,
  cancelBtn: { width: '100%', background: 'transparent', border: '1px solid #3a5a3a', color: '#8aaa8a', padding: 10, borderRadius: 6, cursor: 'pointer', fontSize: 14, marginTop: 8 } as React.CSSProperties,
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 } as React.CSSProperties,
  sectionTitle: { fontSize: 20, fontWeight: 500, color: '#c8d8c0' } as React.CSSProperties,
  sectionSub: { fontSize: 13, color: '#6a8a6a', marginTop: 2 } as React.CSSProperties,
  formCard: { background: '#071407', border: '1px dashed #2a4a2a', borderRadius: 8, padding: 16, marginBottom: 20 } as React.CSSProperties,
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 } as React.CSSProperties,
  modalBox: { background: '#0d1f0d', border: '1px solid #2a4a2a', borderRadius: 10, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' } as React.CSSProperties,
  dragHandle: { cursor: 'grab', color: '#4a6a4a', fontSize: 18, flexShrink: 0, padding: '0 4px', userSelect: 'none' } as React.CSSProperties,
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={S.label}>{label}</label>{children}</div>
}

function Modal({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: () => void; children: React.ReactNode }) {
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#c8d8c0' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6a8a6a', cursor: 'pointer', fontSize: 20 }}>×</button>
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
  const [items, setItems] = useState<Leadership[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<Leadership | null>(null)
  const [form, setForm] = useState({ username: '', title: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'leadership')

  const load = async () => {
    const { data } = await supabase.from('leadership').select('*').order('sort_order')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ username: '', title: '', image_url: '' }); setModal(true) }
  const openEdit = (item: Leadership) => { setEditItem(item); setForm({ username: item.username, title: item.title, image_url: item.image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.username || !form.title) return
    if (editItem) {
      await supabase.from('leadership').update({ username: form.username, title: form.title, image_url: form.image_url || null }).eq('id', editItem.id)
    } else {
      await supabase.from('leadership').insert({ username: form.username, title: form.title, image_url: form.image_url || null, sort_order: items.length })
    }
    setToast(editItem ? 'Updated!' : 'Leader added!')
    setModal(false)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this leader?')) return
    await supabase.from('leadership').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Leadership</div><div style={S.sectionSub}>Manage leadership members</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Leader</button>
      </div>
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={{ ...S.card, opacity: 1 }}
          draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle} title="Drag to reorder">⠿</span>
            <div style={{ width: 44, height: 44, borderRadius: 6, background: '#1a3a1a', border: '1px solid #2a4a2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a7a4a', fontSize: 11, overflow: 'hidden' }}>
              {item.image_url ? <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.username.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#c8d8c0' }}>{item.username}</div>
              <div style={{ fontSize: 12, color: '#4a9a4a', marginTop: 2 }}>{item.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Leader' : 'Add New Leader'} onClose={() => setModal(false)} onSubmit={save}>
          <FormGroup label="Username"><input style={S.input} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g., MajGen_Blackwood" /></FormGroup>
          <FormGroup label="Rank / Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Commandant of the Marine Corps" /></FormGroup>
          <FormGroup label="Profile Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
        </Modal>
      )}
    </div>
  )
}

/* ─── Carousel Tab ───────────────────────────────────────────── */

function CarouselTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ image_url: '', caption: '' })
  const [adding, setAdding] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ image_url: '', caption: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'carousel')

  const load = async () => {
    const { data } = await supabase.from('carousel').select('*').order('sort_order')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.image_url) return
    await supabase.from('carousel').insert({ image_url: form.image_url, caption: form.caption, sort_order: items.length })
    setToast('Image added!')
    setAdding(false)
    setForm({ image_url: '', caption: '' })
    load()
  }

  const saveEdit = async () => {
    if (!editForm.image_url) return
    await supabase.from('carousel').update({ image_url: editForm.image_url, caption: editForm.caption }).eq('id', editItem.id)
    setToast('Updated!')
    setEditItem(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this image?')) return
    await supabase.from('carousel').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Carousel Images</div><div style={S.sectionSub}>Manage homepage carousel</div></div>
        <button style={S.addBtn} onClick={() => setAdding(true)}>+ Add Image</button>
      </div>
      {adding && (
        <div style={S.formCard}>
          <FormGroup label="Image URL"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
          <FormGroup label="Caption (optional)"><input style={S.input} value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Image caption..." /></FormGroup>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.addBtn, flex: 1 }} onClick={save}>Create</button>
            <button onClick={() => setAdding(false)} style={{ ...S.cancelBtn, width: 'auto', marginTop: 0, padding: '8px 16px' }}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ width: 64, height: 40, borderRadius: 4, background: '#1a3a1a', border: '1px solid #2a4a2a', overflow: 'hidden', flexShrink: 0 }}>
              <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <div style={{ flex: 1, fontSize: 14, color: '#c8d8c0' }}>{item.caption || item.image_url}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => { setEditItem(item); setEditForm({ image_url: item.image_url, caption: item.caption || '' }) }}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {editItem && (
        <Modal title="Edit Carousel Image" onClose={() => setEditItem(null)} onSubmit={saveEdit}>
          <FormGroup label="Image URL"><input style={S.input} value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
          <FormGroup label="Caption (optional)"><input style={S.input} value={editForm.caption} onChange={e => setEditForm(f => ({ ...f, caption: e.target.value }))} placeholder="Image caption..." /></FormGroup>
        </Modal>
      )}
    </div>
  )
}

/* ─── Announcements Tab ──────────────────────────────────────── */

function AnnouncementsTab() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ title: '', description: '', date: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'announcements')

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('sort_order')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ title: '', description: '', date: new Date().toLocaleDateString(), image_url: '' }); setModal(true) }
  const openEdit = (item: Announcement) => { setEditItem(item); setForm({ title: item.title, description: item.description, date: item.date, image_url: item.image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.title || !form.description) return
    if (editItem) {
      await supabase.from('announcements').update({ title: form.title, description: form.description, date: form.date, image_url: form.image_url || null }).eq('id', editItem.id)
    } else {
      await supabase.from('announcements').insert({ title: form.title, description: form.description, date: form.date, image_url: form.image_url || null, sort_order: items.length })
    }
    setToast(editItem ? 'Updated!' : 'Added!')
    setModal(false)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('announcements').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Announcements</div><div style={S.sectionSub}>Manage site announcements</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Announcement</button>
      </div>
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            {item.image_url && <div style={{ width: 56, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}><img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#c8d8c0' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#8aaa8a', marginTop: 2 }}>{item.description.slice(0, 60)}...</div>
              <div style={{ fontSize: 12, color: '#6a8a6a' }}>{item.date}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Announcement' : 'New Announcement'} onClose={() => setModal(false)} onSubmit={save}>
          <FormGroup label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" /></FormGroup>
          <FormGroup label="Description"><textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Announcement description" /></FormGroup>
          <FormGroup label="Date"><input style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="04/02/2026" /></FormGroup>
          <FormGroup label="Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
        </Modal>
      )}
    </div>
  )
}

/* ─── Divisions Tab ──────────────────────────────────────────── */

function DivisionsTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ code: '', name: '', role: '', icon: '⚔️', icon_url: '', color: '#1a2a3a', motto: '', description: '', leadership: '', entrance: '', discord_label: '', discord_url: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'divisions')

  const load = async () => {
    const { data } = await supabase.from('divisions').select('*').order('sort_order')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ code: '', name: '', role: '', icon: '⚔️', color: '#1a2a3a', motto: '', description: '', leadership: '', entrance: '', discord_label: '', discord_url: '' }); setModal(true) }
  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({ code: item.code, name: item.name, role: item.role, icon: item.icon || '⚔️', icon_url: item.icon_url || '', color: item.color || '#1a2a3a', motto: item.motto || '', description: item.description, leadership: (item.leadership || []).join('\n'), entrance: item.entrance || '', discord_label: item.discord_label || '', discord_url: item.discord_url || '', image_url: item.image_url || '' })
    setModal(true)
  }

  const save = async () => {
    if (!form.name || !form.description) return
    const payload = { code: form.code, name: form.name, role: form.role, icon: form.icon, icon_url: form.icon_url || null, color: form.color, motto: form.motto, description: form.description, leadership: form.leadership.split('\n').filter((l: string) => l.trim()), entrance: form.entrance, discord_label: form.discord_label, discord_url: form.discord_url, image_url: form.image_url || null }
    if (editItem) {
      await supabase.from('divisions').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('divisions').insert({ ...payload, sort_order: items.length })
    }
    setToast(editItem ? 'Updated!' : 'Division added!')
    setModal(false)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this division?')) return
    await supabase.from('divisions').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Divisions</div><div style={S.sectionSub}>Manage division information</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Division</button>
      </div>
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ width: 40, height: 40, borderRadius: 6, background: item.color || '#1a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
              {item.icon_url ? <img src={item.icon_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#c8d8c0' }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#4a9a4a', marginTop: 2 }}>[{item.code}] — {item.role}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Division' : 'Add Division'} onClose={() => setModal(false)} onSubmit={save}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Code"><input style={S.input} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g., 1MD" /></FormGroup>
            <FormGroup label="Fallback Icon (emoji)"><input style={S.input} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="⚔️" /></FormGroup>
          </div>
          <FormGroup label="Icon Image URL (replaces emoji if set)"><input style={S.input} value={form.icon_url} onChange={e => setForm(f => ({ ...f, icon_url: e.target.value }))} placeholder="https://... (square image works best)" /></FormGroup>
          <FormGroup label="Division Name"><input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., 1st Marine Division" /></FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Role"><input style={S.input} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g., Ground Combat" /></FormGroup>
            <FormGroup label="Header Color"><input style={{ ...S.input, height: 38, padding: 4 }} type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></FormGroup>
          </div>
          <FormGroup label="Motto"><input style={S.input} value={form.motto} onChange={e => setForm(f => ({ ...f, motto: e.target.value }))} placeholder="Division motto" /></FormGroup>
          <FormGroup label="Description"><textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Division description..." /></FormGroup>
          <FormGroup label="Leadership (one per line)"><textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.leadership} onChange={e => setForm(f => ({ ...f, leadership: e.target.value }))} placeholder={"Commanding Officer: Colonel Name\nExecutive Officer: Role Vacant"} /></FormGroup>
          <FormGroup label="Entrance Method"><textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' }} value={form.entrance} onChange={e => setForm(f => ({ ...f, entrance: e.target.value }))} placeholder="How to join..." /></FormGroup>
          <FormGroup label="Cover Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Discord Label"><input style={S.input} value={form.discord_label} onChange={e => setForm(f => ({ ...f, discord_label: e.target.value }))} placeholder="e.g., 1MD Discord" /></FormGroup>
            <FormGroup label="Discord URL"><input style={S.input} value={form.discord_url} onChange={e => setForm(f => ({ ...f, discord_url: e.target.value }))} placeholder="https://discord.gg/..." /></FormGroup>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ─── Regulations Tab ────────────────────────────────────────── */

function RegulationsTab() {
  const [items, setItems] = useState<Regulation[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ number: '', title: '', content: '', document_url: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'regulations')

  const load = async () => {
    const { data } = await supabase.from('regulations').select('*').order('number')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ number: '', title: '', content: '', document_url: '' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ number: String(item.number), title: item.title, content: item.content || '', document_url: item.document_url || '', image_url: item.image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.title) return
    const payload = { number: parseInt(form.number) || items.length + 1, title: form.title, content: form.content, document_url: form.document_url || null, image_url: form.image_url || null }
    if (editItem) {
      await supabase.from('regulations').update(payload).eq('id', editItem.id)
      setToast('Updated!')
    } else {
      await supabase.from('regulations').insert(payload)
      setToast('Regulation added!')
    }
    setModal(false)
    setForm({ number: '', title: '', content: '', document_url: '', image_url: '' })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('regulations').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Marine Regulations</div><div style={S.sectionSub}>Manage regulations</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Regulation</button>
      </div>
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item: any, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <span style={{ color: '#6a8a6a', fontSize: 18, flexShrink: 0 }}>📄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#c8d8c0' }}>Regulation No. {item.number}: {item.title}</div>
              {item.content && <div style={{ fontSize: 12, color: '#6a8a6a', marginTop: 2 }}>{item.content.slice(0, 60)}...</div>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Regulation' : 'Add Regulation'} onClose={() => setModal(false)} onSubmit={save}>
          <FormGroup label="Number"><input style={S.input} type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder={`${items.length + 1}`} /></FormGroup>
          <FormGroup label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Uniform Standards" /></FormGroup>
          <FormGroup label="Full Text Content"><textarea style={{ ...S.input, minHeight: 160, resize: 'vertical' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Paste the full regulation text here. This will be shown when users click on the regulation..." /></FormGroup>
          <FormGroup label="Cover Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
          <FormGroup label="Document URL (optional)"><input style={S.input} value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} placeholder="https://drive.google.com/..." /></FormGroup>
        </Modal>
      )}
    </div>
  )
}

/* ─── Standing Orders Tab ────────────────────────────────────── */

function OrdersTab() {
  const [items, setItems] = useState<StandingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ number: '', title: '', document_url: '', summary: '', status: 'ACTIVE', date: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'standing_orders')

  const load = async () => {
    const { data } = await supabase.from('standing_orders').select('*').order('number')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ number: '', title: '', document_url: '', summary: '', status: 'ACTIVE', date: '', image_url: '' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ number: String(item.number), title: item.title, document_url: item.document_url || '', summary: item.summary || '', status: item.status || 'ACTIVE', date: item.date || '', image_url: item.image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.title) return
    const payload = { number: parseInt(form.number) || items.length + 1, title: form.title, document_url: form.document_url || null, summary: form.summary, status: form.status, date: form.date, image_url: form.image_url || null }
    if (editItem) {
      await supabase.from('standing_orders').update(payload).eq('id', editItem.id)
      setToast('Updated!')
    } else {
      await supabase.from('standing_orders').insert(payload)
      setToast('Order added!')
    }
    setModal(false)
    setForm({ number: '', title: '', document_url: '', summary: '', status: 'ACTIVE', date: '', image_url: '' })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('standing_orders').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Standing Orders</div><div style={S.sectionSub}>Manage standing orders</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Order</button>
      </div>
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <span style={{ color: '#6a8a6a', fontSize: 18, flexShrink: 0 }}>📄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#c8d8c0' }}>Order No. {item.number}: {item.title}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#1a3a1a', color: '#5aaa5a', border: '1px solid #2a5a2a' }}>{item.status}</span>
                {item.date && <span style={{ fontSize: 11, color: '#6a8a6a' }}>{item.date}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.editBtn} onClick={() => openEdit(item)}>✏</button>
              <button style={S.delBtn} onClick={() => del(item.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title={editItem ? 'Edit Standing Order' : 'Add Standing Order'} onClose={() => setModal(false)} onSubmit={save}>
          <FormGroup label="Order Number"><input style={S.input} type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder={`${items.length + 1}`} /></FormGroup>
          <FormGroup label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Rules of Engagement" /></FormGroup>
          <FormGroup label="Document URL (optional)"><input style={S.input} value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} placeholder="https://drive.google.com/..." /></FormGroup>
          <FormGroup label="Summary (optional)"><textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' }} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} /></FormGroup>
          <FormGroup label="Cover Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Status"><select style={S.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>ACTIVE</option><option>SUSPENDED</option><option>RESCINDED</option></select></FormGroup>
            <FormGroup label="Date"><input style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="April 2026" /></FormGroup>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ─── Public Releases Tab ────────────────────────────────────── */

function ReleasesTab() {
  const [items, setItems] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<Release | null>(null)
  const [form, setForm] = useState({ type: 'PRESS RELEASE', title: '', description: '', date: '', document_url: '', image_url: '' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'releases')

  const load = async () => {
    const { data } = await supabase.from('releases').select('*').order('sort_order')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ type: 'PRESS RELEASE', title: '', description: '', date: new Date().getFullYear().toString(), document_url: '', image_url: '' }); setModal(true) }
  const openEdit = (item: Release) => { setEditItem(item); setForm({ type: item.type, title: item.title, description: item.description, date: item.date, document_url: item.document_url || '', image_url: (item as any).image_url || '' }); setModal(true) }

  const save = async () => {
    if (!form.title || !form.description) return
    if (editItem) {
      await supabase.from('releases').update({ type: form.type, title: form.title, description: form.description, date: form.date, document_url: form.document_url || null, image_url: form.image_url || null }).eq('id', editItem.id)
    } else {
      await supabase.from('releases').insert({ type: form.type, title: form.title, description: form.description, date: form.date, document_url: form.document_url || null, image_url: form.image_url || null, sort_order: items.length })
    }
    setToast(editItem ? 'Updated!' : 'Added!')
    setModal(false)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('releases').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Public Releases</div><div style={S.sectionSub}>Manage press releases</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Release</button>
      </div>
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#1a3a2a', color: '#4aaa6a', border: '1px solid #2a5a3a' }}>{item.type}</span>
                <span style={{ fontSize: 11, color: '#6a8a6a' }}>{item.date}</span>
              </div>
              <div style={{ fontSize: 14, color: '#c8d8c0' }}>{item.title}</div>
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
          <FormGroup label="Type"><select style={S.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option>PRESS RELEASE</option><option>OPERATIONAL REPORT</option><option>ANNOUNCEMENT</option><option>POLICY UPDATE</option><option>INTELLIGENCE BULLETIN</option></select></FormGroup>
          <FormGroup label="Title"><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Release title" /></FormGroup>
          <FormGroup label="Description"><textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormGroup>
          <FormGroup label="Date"><input style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="2026" /></FormGroup>
          <FormGroup label="Cover Image URL (optional)"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
          <FormGroup label="Document URL (optional)"><input style={S.input} value={form.document_url} onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))} placeholder="https://..." /></FormGroup>
        </Modal>
      )}
    </div>
  )
}

/* ─── Gallery Tab ────────────────────────────────────────────── */

function GalleryTab() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState({ image_url: '', caption: '', category: 'Operations' })
  const [toast, setToast] = useState('')
  const { onDragStart, onDragOver, onDrop } = useDragReorder(items, setItems, 'gallery')

  const load = async () => {
    const { data } = await supabase.from('gallery').select('*').order('sort_order')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm({ image_url: '', caption: '', category: 'Operations' }); setModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ image_url: item.image_url, caption: item.caption, category: item.category }); setModal(true) }

  const save = async () => {
    if (!form.image_url || !form.caption) return
    if (editItem) {
      await supabase.from('gallery').update({ image_url: form.image_url, caption: form.caption, category: form.category }).eq('id', editItem.id)
      setToast('Updated!')
    } else {
      await supabase.from('gallery').insert({ image_url: form.image_url, caption: form.caption, category: form.category, sort_order: items.length })
      setToast('Photo added!')
    }
    setModal(false)
    setForm({ image_url: '', caption: '', category: 'Operations' })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('gallery').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionHeader}>
        <div><div style={S.sectionTitle}>Photo Gallery</div><div style={S.sectionSub}>Manage gallery images</div></div>
        <button style={S.addBtn} onClick={openAdd}>+ Add Photo</button>
      </div>
      <div style={{ fontSize: 12, color: '#4a6a4a', marginBottom: 10 }}>Drag to reorder</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map((item, i) => (
        <div key={item.id} style={S.card} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={onDrop}>
          <div style={S.row}>
            <span style={S.dragHandle}>⠿</span>
            <div style={{ width: 64, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#c8d8c0' }}>{item.caption}</div>
              <div style={{ fontSize: 12, color: '#4a9a4a' }}>{item.category}</div>
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
          <FormGroup label="Image URL"><input style={S.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></FormGroup>
          <FormGroup label="Caption"><input style={S.input} value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Photo caption..." /></FormGroup>
          <FormGroup label="Category"><select style={S.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}><option>Operations</option><option>Training</option><option>Command</option><option>Aviation</option><option>Other</option></select></FormGroup>
        </Modal>
      )}
    </div>
  )
}

/* ─── Users Tab ──────────────────────────────────────────────── */

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', role: 'User' })
  const [toast, setToast] = useState('')

  const load = async () => {
    const { data } = await supabase.from('admin_users').select('id, email, role, created_at').order('created_at')
    setUsers(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.email || !form.password) return
    await supabase.from('admin_users').insert({ email: form.email, password_hash: form.password, role: form.role })
    setToast('User created!')
    setForm({ email: '', password: '', role: 'User' })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this user?')) return
    await supabase.from('admin_users').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  const updateRole = async (id: string, role: string) => {
    await supabase.from('admin_users').update({ role }).eq('id', id)
    setToast('Role updated!')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionTitle}>Users</div>
      <div style={{ fontSize: 13, color: '#6a8a6a', marginBottom: 20, marginTop: 2 }}>Manage admin access</div>
      <div style={S.formCard}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#8aaa8a', marginBottom: 12 }}>+ Create New User</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          <input style={S.input} placeholder="Username" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input style={S.input} placeholder="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select style={{ ...S.input, width: 140 }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option>User</option><option>Admin</option><option>Owner</option></select>
          <button style={{ ...S.addBtn, flex: 1 }} onClick={create}>Create User</button>
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#8aaa8a', marginBottom: 12 }}>Current Users</div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : users.map(user => (
        <div key={user.id} style={S.card}>
          <div style={S.row}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a3a1a', border: '1px solid #2a5a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#4a9a4a', flexShrink: 0 }}>
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#c8d8c0' }}>{user.email}</div>
              <div style={{ fontSize: 11, color: '#6a8a6a' }}>Added: {new Date(user.created_at).toLocaleDateString()}</div>
            </div>
            <select value={user.role} onChange={e => updateRole(user.id, e.target.value)} style={{ ...S.input, width: 100, marginRight: 8 }}>
              <option>User</option><option>Admin</option><option>Owner</option>
            </select>
            <button style={S.delBtn} onClick={() => del(user.id)}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Settings Tab ───────────────────────────────────────────── */

function SettingsTab() {
  const [items, setItems] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ key: '', value: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [toast, setToast] = useState('')

  const load = async () => {
    const { data } = await supabase.from('settings').select('*').order('key')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.key || !form.value) return
    await supabase.from('settings').upsert({ key: form.key, value: form.value })
    setToast('Setting saved!')
    setForm({ key: '', value: '' })
    load()
  }

  const saveEdit = async (id: string) => {
    await supabase.from('settings').update({ value: editVal }).eq('id', id)
    setToast('Updated!')
    setEditId(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    await supabase.from('settings').delete().eq('id', id)
    setToast('Deleted.')
    load()
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      <div style={S.sectionTitle}>Settings</div>
      <div style={{ fontSize: 13, color: '#6a8a6a', marginBottom: 20, marginTop: 2 }}>Manage site configuration</div>
      <div style={S.formCard}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#8aaa8a', marginBottom: 12 }}>Add New Setting</div>
        <input style={{ ...S.input, marginBottom: 8 }} placeholder="Key (e.g., discord_url)" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} />
        <input style={{ ...S.input, marginBottom: 10 }} placeholder="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
        <button style={S.addBtn} onClick={create}>Create</button>
      </div>
      {loading ? <div style={{ color: '#6a8a6a' }}>Loading...</div> : items.map(item => (
        <div key={item.id} style={{ background: '#0d1f0d', border: '1px solid #2a4a2a', borderRadius: 8, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#c8d8c0' }}>{item.key}</div>
            {editId === item.id
              ? <input style={{ ...S.input, marginTop: 6 }} value={editVal} onChange={e => setEditVal(e.target.value)} />
              : <div style={{ fontSize: 12, color: '#4a9a4a', marginTop: 3, wordBreak: 'break-all' }}>{item.value}</div>
            }
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {editId === item.id
              ? <button onClick={() => saveEdit(item.id)} style={{ background: '#1a4a1a', border: '1px solid #2a6a2a', color: '#4af04a', padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Save</button>
              : <button onClick={() => { setEditId(item.id); setEditVal(item.value) }} style={{ background: '#1a3a1a', border: '1px solid #2a5a2a', color: '#4a9a4a', padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Edit</button>
            }
            <button onClick={() => del(item.id)} style={{ background: '#2a1010', border: '1px solid #5a2020', color: '#f08080', padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontSize: 12 }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
