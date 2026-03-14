import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Phone, Mail } from 'lucide-react'
import { FadeIn, StaggerChildren, StaggerItem } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', contactEmail: '', contactPhone: '', address: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    api.get('/suppliers').then(r => setSuppliers(r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', contactEmail: '', contactPhone: '', address: '' }); setShowForm(true) }
  const openEdit = (s) => { setEditing(s.id); setForm({ name: s.name, contactEmail: s.contactEmail || '', contactPhone: s.contactPhone || '', address: s.address || '' }); setShowForm(true) }

  const handleSave = async () => {
    try {
      if (editing) {
        const r = await api.patch(`/suppliers/${editing}`, form)
        setSuppliers(prev => prev.map(s => s.id === editing ? (r.data?.data || r.data) : s))
      } else {
        const r = await api.post('/suppliers', form)
        setSuppliers(prev => [...prev, r.data?.data || r.data])
      }
      setShowForm(false)
    } catch (err) { alert(err.response?.data?.message || 'Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return
    try { await api.delete(`/suppliers/${id}`); setSuppliers(prev => prev.filter(s => s.id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete') }
  }

  const filtered = suppliers.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.contactEmail?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Suppliers</h2>
          <p>{loading ? '…' : `${suppliers.length} suppliers in directory`}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Supplier</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">{editing ? 'Edit Supplier' : 'New Supplier'}</div>
          <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
            <div className="form-group"><label className="form-label">Company Name *</label>
              <input className="form-input" placeholder="Apex Traders" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Contact Email</label>
              <input className="form-input" type="email" placeholder="contact@supplier.com" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 98765 43210" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Address</label>
              <input className="form-input" placeholder="123 Main St, Mumbai" value={form.address} onChange={e => set('address', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={13} /> Save</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={13} /> Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading suppliers…</div>
      ) : (
        <FadeIn>
          <div style={{ marginBottom: 12 }}>
            <input className="form-input" style={{ width: 300 }} placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Company</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No suppliers found</td></tr>
                  ) : filtered.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {s.contactEmail && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} />{s.contactEmail}</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {s.contactPhone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{s.contactPhone}</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.address || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => openEdit(s)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(s.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
