import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Save, Check, Plus, Trash2 } from 'lucide-react'
import { StaggerChildren, StaggerItem, FadeIn } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

export default function DeliveryCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // States to match backend flow: 1 (Create), 2 (Pick), 3 (Dispatch)
  const [step, setStep] = useState(1)
  const [orderRef, setOrderRef] = useState('')
  const [products, setProducts] = useState([])
  const [lines, setLines] = useState([{ productId: '', quantity: '' }])
  const [activePickList, setActivePickList] = useState(null)

  useEffect(() => {
    // Load products for the creation step
    api.get('/products').then(res => {
      setProducts(res.data?.value || res.data?.data || res.data || [])
    }).catch(console.error)
  }, [])

  const addLine = () => setLines(l => [...l, { productId: '', quantity: '' }])
  const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i))
  const updateLine = (i, k, v) => setLines(l => l.map((row, idx) => idx === i ? { ...row, [k]: v } : row))

  // Step 1: Create the pending Pick List
  const handleCreatePickList = async () => {
    const validLines = lines.filter(l => l.productId && Number(l.quantity) > 0)
    if (!validLines.length) return alert('Add at least one product with a quantity > 0')

    setLoading(true)
    try {
      const { data } = await api.post('/pick-lists', {
        orderRef,
        lines: validLines.map(l => ({ productId: l.productId, quantity: Number(l.quantity) }))
      })
      const pl = data.data || data
      setActivePickList(pl)
      // Transition to pick phase
      setLines(pl.lines.map(l => ({ ...l, quantityPicked: 0 })))
      setStep(2)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create Pick List')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 & 3 Combined UX: Pick the quantities and immediately dispatch
  const handlePickAndDispatch = async () => {
    setLoading(true)
    try {
      // Pick each line
      for (const line of lines) {
        if (Number(line.quantityPicked) > 0) {
          await api.patch(`/pick-lists/${activePickList.id}/lines/${line.id}`, {
            quantityPicked: Number(line.quantityPicked)
          })
        }
      }
      // Dispatch the Pick List to send the stock out
      await api.post(`/pick-lists/${activePickList.id}/dispatch`)
      alert('Delivery Dispatched and Stock updated successfully!')
      navigate('/delivery')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch Delivery')
    } finally {
      setLoading(false)
    }
  }

  const updatePickLine = (id, val) => {
    setLines(l => l.map(row => row.id === id ? { ...row, quantityPicked: val } : row))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>New Delivery Order (Pick List)</h2>
          <p>Create outgoing stock movement</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/delivery')}><ArrowLeft size={15} /> Back</button>
          
          {step === 1 ? (
             <button className="btn btn-primary" onClick={handleCreatePickList} disabled={loading}>
               Create Pick List <ArrowRight size={15} />
             </button>
          ) : (
             <button className="btn btn-success" onClick={handlePickAndDispatch} disabled={loading}>
               <Check size={15} /> {loading ? 'Processing…' : 'Validate & Dispatch'}
             </button>
          )}
        </div>
      </div>

      <StaggerChildren stagger={0.08}>
        {step === 1 ? (
          <>
            <StaggerItem>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="section-title">Delivery Details</div>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Sales Order Ref.</label>
                    <input className="form-input" placeholder="e.g. SO-2026-0022" value={orderRef} onChange={e => setOrderRef(e.target.value)} />
                  </div>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div className="section-title" style={{ margin: 0 }}>Product Lines Required</div>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={addLine}>
                    <Plus size={13} /> Add Line
                  </button>
                </div>
                
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Product</th><th>Demand Quantity</th><th></th></tr></thead>
                    <tbody>
                      {lines.map((line, i) => (
                        <tr key={i}>
                          <td>
                            <select className="form-select" value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)}>
                              <option value="">Select product…</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                            </select>
                          </td>
                          <td>
                            <input className="form-input" type="number" style={{ width: 120 }} placeholder="0" min={0} value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} />
                          </td>
                          <td>
                            <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => removeLine(i)} disabled={lines.length === 1}><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </StaggerItem>
          </>
        ) : (
          <StaggerItem>
             <FadeIn>
              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>Pick Items for Dispatch</div>
                
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {['Pick', 'Dispatch'].map((stage, i) => (
                    <div key={stage} style={{
                      padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: i === 0 ? 'var(--accent-soft)' : 'var(--bg-hover)',
                      color: i === 0 ? 'var(--accent)' : 'var(--text-muted)',
                      border: i === 0 ? '1px solid var(--accent-border)' : '1px solid var(--border)'
                    }}>{stage}</div>
                  ))}
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Demand Qty</th>
                        <th>Picked Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.id}>
                          <td style={{ fontWeight: 500 }}>{line.product?.name} <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 400 }}>({line.product?.sku})</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{line.quantity}</td>
                          <td>
                            <input
                              className="form-input"
                              type="number"
                              min={0}
                              max={line.quantity}
                              style={{ width: 120 }}
                              value={line.quantityPicked}
                              onChange={e => updatePickLine(line.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeIn>
          </StaggerItem>
        )}
      </StaggerChildren>
    </div>
  )
}
