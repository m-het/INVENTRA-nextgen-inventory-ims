import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { FadeIn, StaggerChildren, StaggerItem } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

const statusColors = {
  draft: 'draft', pending: 'waiting', confirmed: 'ready', received: 'done', cancelled: 'cancelled'
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ supplierId: '', expectedDate: '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([api.get('/purchase-orders'), api.get('/suppliers')]).then(([poRes, sRes]) => {
      setOrders(poRes.data?.data || poRes.data || [])
      setSuppliers(sRes.data?.data || sRes.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    try {
      const r = await api.post('/purchase-orders', form)
      setOrders(prev => [r.data?.data || r.data, ...prev])
      setShowForm(false); setForm({ supplierId: '', expectedDate: '', notes: '' })
    } catch (err) { alert(err.response?.data?.message || 'Failed to create order') }
  }

  const handleConfirm = async (id) => {
    try {
      const r = await api.patch(`/purchase-orders/${id}`, { status: 'confirmed' })
      setOrders(prev => prev.map(o => o.id === id ? (r.data?.data || r.data) : o))
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this purchase order?')) return
    try { await api.delete(`/purchase-orders/${id}`); setOrders(prev => prev.filter(o => o.id !== id)) }
    catch (err) { alert(err.response?.data?.message || 'Failed') }
  }

  const filtered = orders.filter(o => statusFilter === 'All' || o.status === statusFilter.toLowerCase())

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Purchase Orders</h2>
          <p>{loading ? '…' : `${orders.length} total orders`}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}><Plus size={15} /> New Order</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">New Purchase Order</div>
          <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
            <div className="form-group"><label className="form-label">Supplier *</label>
              <select className="form-select" value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Expected Date</label>
              <input className="form-input" type="date" value={form.expectedDate} onChange={e => set('expectedDate', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleCreate}>Create Order</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading purchase orders…</div>
      ) : (
        <FadeIn>
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            {['All', 'Draft', 'Pending', 'Confirmed', 'Received', 'Cancelled'].map(s => (
              <button key={s} className={`filter-chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Reference</th><th>Supplier</th><th>Expected Date</th><th>Lines</th><th>Status</th><th>Actions</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No orders found</td></tr>
                  ) : filtered.map(o => (
                    <>
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{o.reference || o.id}</td>
                        <td>{o.supplier?.name || o.supplierName || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : '—'}</td>
                        <td>{o.lines?.length ?? o.lineCount ?? 0}</td>
                        <td><span className={`badge badge-${statusColors[o.status] || 'draft'}`}>{o.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {o.status === 'draft' && <button className="btn btn-success" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleConfirm(o.id)}>Confirm</button>}
                            {o.status === 'draft' && <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(o.id)}><Trash2 size={13} /></button>}
                          </div>
                        </td>
                        <td>
                          {o.lines?.length > 0 && (
                            <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                              {expanded === o.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === o.id && o.lines?.map((line, li) => (
                        <tr key={`${o.id}-${li}`} style={{ background: 'var(--bg-secondary)' }}>
                          <td colSpan={2} style={{ paddingLeft: 40, fontSize: 13, color: 'var(--text-muted)' }}>↳ {line.product?.name || line.productName}</td>
                          <td style={{ fontSize: 13 }}>{line.product?.sku || line.sku}</td>
                          <td style={{ fontSize: 13 }}>Qty: {line.quantity}</td>
                          <td style={{ fontSize: 13 }}>@ {line.unitPrice}</td>
                          <td colSpan={2}></td>
                        </tr>
                      ))}
                    </>
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
