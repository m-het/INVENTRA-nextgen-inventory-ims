import { useState, useEffect } from 'react'
import { Check, Plus, Trash2, ArrowRight } from 'lucide-react'
import { StaggerChildren, StaggerItem, FadeIn } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

export default function Adjustments() {
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Multi-step state
  const [step, setStep] = useState(1) // 1: Select Location, 2: Add Lines, 3: Review & Submit
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [activeStockCount, setActiveStockCount] = useState(null)
  
  const [lines, setLines] = useState([{ productId: '', systemQuantity: 0, countedQuantity: '' }])

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/warehouses')]).then(([pRes, wRes]) => {
      setProducts(pRes.data?.value || pRes.data?.data || pRes.data || [])
      setWarehouses(wRes.data?.value || wRes.data?.data || wRes.data || [])
    }).catch(console.error)
  }, [])

  const addLine = () => setLines(l => [...l, { productId: '', systemQuantity: 0, countedQuantity: '' }])
  const removeL = (i) => setLines(l => l.filter((_, idx) => idx !== i))
  const update = (i, k, v) => setLines(l => l.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  const diff = (s, c) => (c === '' ? null : Number(c) - Number(s))

  const handleCreateCount = async () => {
    if (!selectedWarehouse) return alert('Select a warehouse first')
    setLoading(true)
    try {
      const { data } = await api.post('/stock-counts', { locationId: selectedWarehouse })
      const sc = data.data || data
      setActiveStockCount(sc)
      setStep(2)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start count')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLinesAndSubmit = async () => {
    const validLines = lines.filter(l => l.productId)
    if (!validLines.length) return alert('Add at least one product')
    setLoading(true)
    try {
      // Step 2: Add lines to DRAFT
      await api.post(`/stock-counts/${activeStockCount.id}/lines`, {
        lines: validLines.map(l => ({ productId: l.productId, binId: null }))
      })
      
      // We need to re-fetch the stock count to get the `systemQuantity` for the products added
      const { data } = await api.get(`/stock-counts/${activeStockCount.id}`)
      const sc = data.data || data
      setActiveStockCount(sc)
      
      // Match the frontend lines with the fetched lines to retain the user's `countedQuantity` input
      const preparedLines = validLines.map(vl => {
        const matched = sc.lines.find(sl => sl.productId === vl.productId)
        return {
          lineId: matched?.id,
          countedQuantity: Number(vl.countedQuantity)
        }
      })
      
      // Step 3: Submit the counted quantities (moves to IN_PROGRESS)
      await api.patch(`/stock-counts/${sc.id}/lines`, { lines: preparedLines })
      
      // Step 4: Complete the adjustment (moves to COMPLETED and generates StockMovements)
      await api.post(`/stock-counts/${sc.id}/complete`)
      
      alert('Adjustment applied successfully!')
      setStep(1)
      setSelectedWarehouse('')
      setActiveStockCount(null)
      setLines([{ productId: '', systemQuantity: 0, countedQuantity: '' }])
      
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply adjustment')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Inventory Adjustment</h2>
          <p>Fix mismatches between recorded and physical stock</p>
        </div>
        <div className="page-actions">
          {step === 1 ? (
            <button className="btn btn-primary" onClick={handleCreateCount} disabled={loading || !selectedWarehouse}>
              Start Count <ArrowRight size={15} />
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={addLine}>+ Add Product</button>
              <button className="btn btn-primary" onClick={handleAddLinesAndSubmit} disabled={loading}>
                <Check size={15} /> {loading ? 'Submitting…' : 'Apply Adjustment'}
              </button>
            </>
          )}
        </div>
      </div>

      {step === 1 ? (
        <FadeIn>
          <div className="card" style={{ maxWidth: 500 }}>
            <div className="section-title">Select Location</div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Choose the warehouse where the physical count is taking place.</p>
            <div className="form-group">
              <label className="form-label">Warehouse</label>
              <select className="form-select" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                <option value="">Select a warehouse…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
        </FadeIn>
      ) : (
        <StaggerChildren stagger={0.07}>
          <StaggerItem>
            <div className="card">
              <div className="section-title">Stock Count Lines</div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>System Qty</th>
                      <th>Counted Qty</th>
                      <th>Variance</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((row, i) => {
                      const systemQty = row.systemQuantity || 0
                      const d = diff(systemQty, row.countedQuantity)
                      return (
                        <tr key={i}>
                          <td>
                            <select className="form-select" value={row.productId} onChange={e => update(i, 'productId', e.target.value)}>
                              <option value="">Select product…</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                            </select>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {row.productId ? 'Auto-calculated on submit' : '—'}
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="number"
                              style={{ width: 120 }}
                              placeholder="Physical qty"
                              value={row.countedQuantity}
                              onChange={e => update(i, 'countedQuantity', e.target.value)}
                            />
                          </td>
                          <td style={{ fontWeight: 700, color: d === null ? 'var(--text-muted)' : d > 0 ? 'var(--status-done)' : d < 0 ? 'var(--status-cancelled)' : 'var(--text-muted)' }}>
                            {d === null ? '—' : d > 0 ? `+${d}` : d}
                          </td>
                          <td>
                            <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => removeL(i)} disabled={lines.length === 1}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </StaggerItem>
        </StaggerChildren>
      )}
    </div>
  )
}
