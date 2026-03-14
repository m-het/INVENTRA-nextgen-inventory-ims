import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import { FadeIn } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

const statuses = ['draft', 'waiting', 'ready', 'done', 'cancelled']

export default function Receipts() {
  const [receipts, setReceipts] = useState([])
  const [status, setStatus] = useState('All')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/grn').then(r => setReceipts(r.data?.value || r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleValidate = async (id) => {
    try {
      await api.post(`/grn/${id}/confirm`)
      setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'done' } : r))
    } catch (err) {
      console.error('Confirm GRN error', err)
    }
  }

  const filtered = receipts.filter(r => status === 'All' || r.status === status.toLowerCase())

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Receipts</h2>
          <p>Incoming stock from suppliers</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/receipts/new')}>
            <Plus size={15} /> New Receipt
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading receipts…</div>
      ) : (
        <FadeIn>
          <div className="filter-bar">
            {['All', ...statuses].map(s => (
              <button key={s} className={`filter-chip${status === s || (status === 'All' && s === 'All') ? ' active' : ''}`}
                onClick={() => setStatus(s === 'All' ? 'All' : s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Reference</th><th>Supplier</th><th>Date</th><th>Lines</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No receipts found</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.reference || r.id}</td>
                      <td>{r.supplier?.name || r.supplierName || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.expectedDate ? new Date(r.expectedDate).toLocaleDateString() : '—'}</td>
                      <td>{r.lines?.length ?? r.lineCount ?? 0}</td>
                      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      <td>
                        {r.status === 'ready' && (
                          <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleValidate(r.id)}>
                            <Check size={13} /> Validate
                          </button>
                        )}
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
