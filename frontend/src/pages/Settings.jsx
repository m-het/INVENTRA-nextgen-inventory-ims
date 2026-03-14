import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Warehouse, Tag, Users, MapPin, FileText } from 'lucide-react'
import { FadeIn, StaggerChildren, StaggerItem } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

// ── Warehouses Section ──────────────────────────────────────────────
function WarehousesSection() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', city: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    api.get('/warehouses').then(r => setWarehouses(r.data?.value || r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', city: '' }); setShowForm(true) }
  const openEdit = (wh) => { setEditing(wh.id); setForm({ name: wh.name, code: wh.code, city: wh.city || '' }); setShowForm(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        const r = await api.patch(`/warehouses/${editing}`, form)
        setWarehouses(prev => prev.map(w => w.id === editing ? (r.data?.data || r.data) : w))
      } else {
        const r = await api.post('/warehouses', form)
        setWarehouses(prev => [...prev, r.data?.data || r.data])
      }
      setShowForm(false)
    } catch (err) { alert(err.response?.data?.message || 'Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this warehouse?')) return
    try {
      await api.delete(`/warehouses/${id}`)
      setWarehouses(prev => prev.filter(w => w.id !== id))
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete') }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>Warehouses</div>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={openCreate}>
          <Plus size={13} /> New Warehouse
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
          <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
            <div className="form-group"><label className="form-label">Name *</label>
              <input className="form-input" placeholder="Main Warehouse" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Code *</label>
              <input className="form-input" placeholder="WH-001" value={form.code} onChange={e => set('code', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">City</label>
              <input className="form-input" placeholder="Hyderabad" value={form.city} onChange={e => set('city', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSave}><Save size={13} /> Save</button>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowForm(false)}><X size={13} /> Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading…</div> : (
        <StaggerChildren stagger={0.07}>
          {warehouses.map(wh => (
            <StaggerItem key={wh.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 12, border: '1px solid var(--border)' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                  <Warehouse size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{wh.name}
                    <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{wh.code}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{wh.city || 'No city specified'}</div>
                </div>
                <span className={`badge badge-${wh.isActive !== false ? 'done' : 'draft'}`}>{wh.isActive !== false ? 'Active' : 'Inactive'}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => openEdit(wh)}><Edit2 size={13} /></button>
                  <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(wh.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </StaggerItem>
          ))}
          {warehouses.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 16, textAlign: 'center' }}>No warehouses yet</div>}
        </StaggerChildren>
      )}
    </div>
  )
}

// ── Categories Section ──────────────────────────────────────────────
function CategoriesSection() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '' })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data?.value || r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      if (editing) {
        const r = await api.patch(`/categories/${editing}`, form)
        setCategories(prev => prev.map(c => c.id === editing ? (r.data?.data || r.data) : c))
      } else {
        const r = await api.post('/categories', form)
        setCategories(prev => [...prev, r.data?.data || r.data])
      }
      setShowForm(false); setForm({ name: '' }); setEditing(null)
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return
    try { await api.delete(`/categories/${id}`); setCategories(prev => prev.filter(c => c.id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>Categories</div>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => { setEditing(null); setForm({ name: '' }); setShowForm(true) }}>
          <Plus size={13} /> New Category
        </button>
      </div>
      {showForm && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="form-input" placeholder="Category name" value={form.name} onChange={e => setForm({ name: e.target.value })} />
          <button className="btn btn-primary" onClick={handleSave}><Save size={13} /></button>
          <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={13} /></button>
        </div>
      )}
      {loading ? <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Products</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{editing === c.id
                    ? <input className="form-input" value={form.name} onChange={e => setForm({ name: e.target.value })} />
                    : c.name}</td>
                  <td><span className="badge badge-done">{c._count?.products ?? c.productCount ?? 0}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {editing === c.id
                        ? <><button className="btn btn-primary" style={{ padding: '5px 8px' }} onClick={handleSave}><Save size={13} /></button>
                          <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => setEditing(null)}><X size={13} /></button></>
                        : <><button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => { setEditing(c.id); setForm({ name: c.name }); setShowForm(false) }}><Edit2 size={13} /></button>
                          <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(c.id)}><Trash2 size={13} /></button></>}
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No categories yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Users Section ──────────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data?.value || r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this user?')) return
    try { await api.delete(`/users/${id}`); setUsers(prev => prev.filter(u => u.id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>Users</div>
      </div>
      {loading ? <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name || u.fullName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td><span className="badge badge-ready">{u.role}</span></td>
                  <td><span className={`badge badge-${u.isActive !== false ? 'done' : 'cancelled'}`}>{u.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                  <td><button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(u.id)}><Trash2 size={13} /></button></td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Audit Logs Section ────────────────────────────────────────────
function AuditLogsSection() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/audit-logs').then(r => setLogs(r.data?.value || r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="card">
      <div className="section-title" style={{ marginBottom: 16 }}>Audit Logs</div>
      {loading ? <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>User</th><th>Action</th><th>Resource</th><th>Date</th></tr></thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id || i}>
                  <td style={{ fontWeight: 500 }}>{log.user?.name || log.userName || '—'}</td>
                  <td><span className="badge badge-ready">{log.action}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{log.resource} {log.resourceId ? `#${log.resourceId}` : ''}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No audit logs yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Settings Page ─────────────────────────────────────────────────
const sections = [
  { key: 'warehouses', label: '🏭 Warehouses', icon: Warehouse },
  { key: 'categories', label: '🏷️ Categories', icon: Tag },
  { key: 'users',      label: '👥 Users',       icon: Users },
  { key: 'audit-logs', label: '📋 Audit Logs',  icon: FileText },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('warehouses')

  return (
    <div>
      <div className="page-header">
        <div><h2>Settings</h2><p>Configure warehouses, categories, users, and system preferences</p></div>
      </div>
      <FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
          <div className="card" style={{ padding: '12px 8px', alignSelf: 'start' }}>
            {sections.map(s => (
              <button key={s.key} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                fontFamily: 'var(--font)', transition: 'all 0.18s',
                background: activeSection === s.key ? 'var(--accent-soft)' : 'none',
                color: activeSection === s.key ? 'var(--accent)' : 'var(--text-secondary)',
              }} onClick={() => setActiveSection(s.key)}>{s.label}</button>
            ))}
          </div>
          <div>
            {activeSection === 'warehouses' && <WarehousesSection />}
            {activeSection === 'categories' && <CategoriesSection />}
            {activeSection === 'users' && <UsersSection />}
            {activeSection === 'audit-logs' && <AuditLogsSection />}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
