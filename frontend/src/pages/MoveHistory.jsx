import { useState, useEffect } from 'react'
import { FadeIn } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

const typeColors = {
  in: 'var(--status-done)', out: 'var(--status-cancelled)',
  internal: 'var(--status-ready)', adjustment: 'var(--status-waiting)'
}
const typeLabels = { in: 'Receipt', out: 'Delivery', internal: 'Internal', adjustment: 'Adjustment' }

export default function MoveHistory() {
  const [moves, setMoves] = useState([])
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/movements').then(r => setMoves(r.data?.value || r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = moves.filter(m => {
    const mType = m.type?.toLowerCase() || ''
    const typeOk = typeFilter === 'All' ||
      mType === typeFilter.toLowerCase() ||
      (typeLabels[mType] || '').toLowerCase().includes(typeFilter.toLowerCase())
    const q = search.toLowerCase()
    const textOk = !q ||
      m.product?.name?.toLowerCase().includes(q) ||
      m.product?.sku?.toLowerCase().includes(q) ||
      m.reference?.toLowerCase().includes(q)
    return typeOk && textOk
  })

  return (
    <div>
      <div className="page-header">
        <div><h2>Move History</h2><p>Complete stock movement ledger</p></div>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading movements…</div>
      ) : (
        <FadeIn>
          <div className="filter-bar">
            {['All', 'Receipt', 'Delivery', 'Internal', 'Adjustment'].map(f => (
              <button key={f} className={`filter-chip${typeFilter === f ? ' active' : ''}`} onClick={() => setTypeFilter(f)}>{f}</button>
            ))}
            <input className="form-input" style={{ width: 220, borderRadius: 99, marginLeft: 'auto' }}
              placeholder="Search product, SKU, ref…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Reference</th><th>Type</th><th>Product</th><th>SKU</th><th>From</th><th>To</th><th>Qty</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const mType = m.type?.toLowerCase() || 'internal'
                    const color = typeColors[mType] || 'var(--text-muted)'
                    const label = typeLabels[mType] || m.type
                    const qty = m.quantity ?? m.qty ?? 0
                    return (
                      <tr key={m.id || i}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{m.reference || m.id}</td>
                        <td>
                          <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: `${color}22`, color }}>
                            {label}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{m.product?.name || m.productName || '—'}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>{m.product?.sku || m.sku || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.fromLocation?.name || m.fromWarehouse?.name || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.toLocation?.name || m.toWarehouse?.name || '—'}</td>
                        <td style={{ fontWeight: 700, color: qty > 0 ? 'var(--status-done)' : 'var(--status-cancelled)' }}>
                          {qty > 0 ? `+${qty}` : qty}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No movements found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
