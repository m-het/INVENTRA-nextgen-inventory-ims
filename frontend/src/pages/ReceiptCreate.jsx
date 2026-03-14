import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { StaggerChildren, StaggerItem } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

export default function ReceiptCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  
  const [form, setForm] = useState({ supplierId: '', warehouseId: '', notes: '' })
  const [lines, setLines] = useState([{ id: Date.now(), productId: '', quantity: '' }])

  useEffect(() => {
    Promise.all([
      api.get('/suppliers'),
      api.get('/warehouses'),
      api.get('/products')
    ]).then(([sRes, wRes, pRes]) => {
      setSuppliers(sRes.data?.value || sRes.data?.data || sRes.data || [])
      setWarehouses(wRes.data?.value || wRes.data?.data || wRes.data || [])
      setProducts(pRes.data?.value || pRes.data?.data || pRes.data || [])
    }).catch(console.error)
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAddLine = () => {
    setLines([...lines, { id: Date.now(), productId: '', quantity: '' }])
  }

  const handleRemoveLine = (id) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id))
    }
  }

  const handleLineChange = (id, field, value) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const handleValidate = async () => {
    if (!form.supplierId || !form.warehouseId) {
      return alert('Please select a Supplier and Destination Warehouse.')
    }
    const validLines = lines.filter(l => l.productId && Number(l.quantity) > 0)
    if (validLines.length === 0) {
      return alert('Please add at least one product with a valid quantity.')
    }

    setLoading(true)
    try {
      const payload = {
        supplierId: form.supplierId,
        locationId: form.warehouseId,
        notes: form.notes || undefined,
        lines: validLines.map(l => ({
          productId: l.productId,
          quantityReceived: Number(l.quantity)
        }))
      }
      await api.post('/grn/direct', payload)
      // Remove alert to let them proceed without extra click
      navigate('/receipts')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create Direct Receipt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Direct Receipt (Incoming Goods)</h2>
          <p>Record items arriving from a vendor manually to immediately raise stock.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/receipts')}><ArrowLeft size={15} /> Back</button>
          <button className="btn btn-primary" onClick={handleValidate} disabled={loading}>
            <Save size={15} /> {loading ? 'Processing…' : 'Validate'}
          </button>
        </div>
      </div>

      <StaggerChildren stagger={0.07}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 }}>
          <StaggerItem>
            <div className="card">
              <div className="section-title">Receipt Details</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <select className="form-select" value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
                    <option value="">Select a Supplier…</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Warehouse *</label>
                  <select className="form-select" value={form.warehouseId} onChange={e => set('warehouseId', e.target.value)}>
                    <option value="">Select Warehouse…</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <input className="form-input" placeholder="Optional notes for this receipt…" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Products Received</div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          <select className="form-select" style={{ minWidth: 200 }} value={line.productId} onChange={e => handleLineChange(line.id, 'productId', e.target.value)}>
                            <option value="">Select Product…</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                          </select>
                        </td>
                        <td>
                          <input className="form-input" type="number" min={1} placeholder="Qty" value={line.quantity} onChange={e => handleLineChange(line.id, 'quantity', e.target.value)} style={{ width: 120 }} />
                        </td>
                        <td>
                          <button className="btn btn-ghost" style={{ padding: 8, color: 'var(--text-muted)' }} onClick={() => handleRemoveLine(line.id)} disabled={lines.length === 1}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-ghost" onClick={handleAddLine} style={{ marginTop: 16 }}>
                <Plus size={15} /> Add Line
              </button>
            </div>
          </StaggerItem>
        </div>
      </StaggerChildren>
    </div>
  )
}
