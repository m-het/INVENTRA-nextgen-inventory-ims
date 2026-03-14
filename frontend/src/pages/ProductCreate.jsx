import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { StaggerChildren, StaggerItem } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

const uoms = ['pcs', 'kg', 'g', 'litre', 'metre', 'roll', 'box', 'sheet', 'set']

export default function ProductCreate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [categories, setCategories] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', categoryId: '', uom: '', reorderPoint: '', description: '', warehouseId: '', initialStock: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/warehouses')]).then(([cRes, wRes]) => {
      setCategories(cRes.data?.value || cRes.data?.data || cRes.data || [])
      setWarehouses(wRes.data?.value || wRes.data?.data || wRes.data || [])
    }).catch(console.error)

    if (id) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data?.data || res.data
        if (p) {
          setForm({
            name: p.name || '',
            sku: p.sku || '',
            categoryId: p.categoryId || '',
            uom: p.unitOfMeasure || p.uom || '',
            reorderPoint: p.reorderLevel || p.reorderPoint || '',
            description: p.description || '',
            warehouseId: '',
          })
        }
      }).catch(console.error)
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId || undefined,
        unitOfMeasure: form.uom || undefined,
        reorderLevel: form.reorderPoint ? Number(form.reorderPoint) : undefined,
        description: form.description || undefined,
      }
      if (id) {
        await api.patch(`/products/${id}`, payload)
      } else {
        if (form.initialStock && Number(form.initialStock) > 0) {
          payload.initialStock = Number(form.initialStock)
          payload.initialWarehouseId = form.warehouseId || undefined
        }
        await api.post('/products', payload)
      }
      navigate('/products')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{id ? 'Edit Product' : 'New Product'}</h2>
          <p>{id ? 'Update product details' : 'Fill in the details to add a product to inventory'}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/products')}><ArrowLeft size={15} /> Back</button>
          <button className="btn btn-primary" form="product-form" type="submit" disabled={loading}>
            <Save size={15} /> {loading ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit}>
        <StaggerChildren stagger={0.07}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Basic Info */}
            <StaggerItem>
              <div className="card">
                <div className="section-title">Basic Information</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" placeholder="e.g. Steel Rods 12mm" required value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU / Code *</label>
                    <input className="form-input" placeholder="e.g. ST-001" required disabled={!!id} value={form.sku} onChange={e => set('sku', e.target.value)} />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                        <option value="">Select…</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit of Measure</label>
                      <select className="form-select" value={form.uom} onChange={e => set('uom', e.target.value)}>
                        <option value="">Select…</option>
                        {uoms.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Extra */}
            <StaggerItem>
              <div className="card">
                <div className="section-title">Additional Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" rows={4} placeholder="Optional product description…" value={form.description} onChange={e => set('description', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Point</label>
                    <input className="form-input" type="number" min={0} placeholder="Trigger low stock alert when below this" value={form.reorderPoint} onChange={e => set('reorderPoint', e.target.value)} />
                  </div>
                  
                  {!id && (
                    <>
                      <div className="form-group" style={{ marginTop: 8 }}>
                        <label className="form-label">Initial Stock Qty (Optional)</label>
                        <input className="form-input" type="number" min={0} placeholder="0" value={form.initialStock} onChange={e => set('initialStock', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Initial Stock Location</label>
                        <select className="form-select" value={form.warehouseId} onChange={e => set('warehouseId', e.target.value)}>
                          <option value="">Select Warehouse…</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </StaggerItem>
          </div>
        </StaggerChildren>
      </form>
    </div>
  )
}
