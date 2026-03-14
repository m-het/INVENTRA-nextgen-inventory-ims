import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import { FadeIn } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

const typeColors = {
  receipt: 'var(--status-done)', delivery: 'var(--status-cancelled)',
  internal: 'var(--status-ready)', adjustment: 'var(--status-waiting)'
}

export default function Delivery() {
  const [pickLists, setPickLists] = useState([])
  const [status, setStatus] = useState('All')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/pick-lists').then(r => setPickLists(r.data?.value || r.data?.data || r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleDispatch = async (id) => {
    try {
      await api.post(`/pick-lists/${id}/dispatch`)
      setPickLists(prev => prev.map(p => p.id === id ? { ...p, status: 'done' } : p))
    } catch (err) {
      console.error('Dispatch error', err)
    }
  }

  const filtered = pickLists.filter(p => status === 'All' || p.status?.toLowerCase() === status.toLowerCase())

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Delivery Orders</h2>
          <p>Outgoing stock pick lists</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/delivery/new')}>
            <Plus size={15} /> New Delivery
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading deliveries…</div>
      ) : (
        <FadeIn>
          <div className="filter-bar">
            {['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Cancelled'].map(s => (
              <button key={s} className={`filter-chip${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Reference</th><th>Destination</th><th>Date</th><th>Lines</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No deliveries found</td></tr>
                  ) : filtered.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{d.reference || d.id}</td>
                      <td>{d.destinationWarehouse?.name || d.destination || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString() : '—'}</td>
                      <td>{d.lines?.length ?? d.lineCount ?? 0}</td>
                      <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                      <td>
                        {(d.status === 'ready' || d.status === 'waiting') && (
                          <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleDispatch(d.id)}>
                            <Check size={13} /> Dispatch
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
