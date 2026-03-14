import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, TruckIcon, PackagePlus, AlertTriangle, ArrowUpRight
} from 'lucide-react'
import { StaggerChildren, StaggerItem, FadeIn, AnimatedNumber } from '../components/Animated'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/shared.css'

const docTypes = ['All', 'Receipts', 'Delivery', 'Internal', 'Adjustments']
const statuses = ['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Cancelled']

export default function Dashboard() {
  const [kpis, setKpis] = useState([])
  const [recent, setRecent] = useState([])
  const [docFilter, setDocFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const { user } = useAuth()
  const isManager = user?.role === 'INVENTORY_MANAGER'

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kpiRes, docsRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/documents'),
        ])
        const k = kpiRes.data?.data || kpiRes.data
        
        const kpiItems = []
        if (isManager) {
          kpiItems.push({ label: 'Total Products', value: k.totalProducts ?? 0, icon: Package, delta: `+${k.newProductsThisWeek ?? 0} this week`, type: 'up' })
          kpiItems.push({ label: 'Low / Out of Stock', value: (k.lowStockCount ?? 0) + (k.outOfStockCount ?? 0), icon: AlertTriangle, delta: `${k.outOfStockCount ?? 0} critical`, type: 'warn' })
        }
        kpiItems.push({ label: 'Pending Receipts', value: k.pendingReceipts ?? 0, icon: PackagePlus, delta: `${k.arrivingToday ?? 0} arriving today`, type: 'up' })
        kpiItems.push({ label: 'Pending Deliveries', value: k.pendingDeliveries ?? 0, icon: TruckIcon, delta: `${k.overdueDeliveries ?? 0} overdue`, type: 'down' })
        
        setKpis(kpiItems)
        
        const docs = docsRes.data?.value || docsRes.data?.data || docsRes.data || []
        setRecent(Array.isArray(docs) ? docs : [])
      } catch (err) {
        console.error('Dashboard fetch error', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [isManager])

  const filtered = recent.filter(r => {
    const docOk = docFilter === 'All' || r.type?.toLowerCase().includes(docFilter.toLowerCase().replace('s', ''))
    const stOk = statusFilter === 'All' || r.status === statusFilter.toLowerCase()
    return docOk && stOk
  })

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading dashboard…</div>

  return (
    <div>
      {/* KPI Cards */}
      <StaggerChildren className="grid-4" stagger={0.08}>
        {kpis.map((k) => (
          <StaggerItem key={k.label}>
            <div className="kpi">
              <div className="kpi-icon"><k.icon size={18} /></div>
              <div className="kpi-value"><AnimatedNumber value={k.value} /></div>
              <div className="kpi-label">{k.label}</div>
              <div className={`kpi-delta kpi-delta-${k.type}`}>{k.delta}</div>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* Filters */}
      <FadeIn delay={0.35} style={{ marginTop: 28 }}>
        <div className="section-title">Document Type</div>
        <div className="filter-bar">
          {docTypes.map(f => (
            <button key={f} className={`filter-chip${docFilter === f ? ' active' : ''}`} onClick={() => setDocFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="section-title" style={{ marginTop: 16 }}>Status</div>
        <div className="filter-bar">
          {statuses.map(s => (
            <button key={s} className={`filter-chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </FadeIn>

      {/* Recent Operations */}
      <FadeIn delay={0.45} style={{ marginTop: 24 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Recent Operations</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th><th>Type</th><th>Partner / Route</th>
                  <th>Date</th><th>Lines</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No operations match filters</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id || r.reference}>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.reference || r.id}</td>
                      <td>{r.type}</td>
                      <td>{r.partner || r.partnerName || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                      <td>{r.items ?? r.lineCount ?? 0}</td>
                      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      <td><ArrowUpRight size={15} style={{ color: 'var(--text-muted)' }} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
