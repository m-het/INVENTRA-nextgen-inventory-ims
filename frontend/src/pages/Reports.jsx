import { useState, useEffect } from 'react'
import { BarChart2, TrendingDown, TrendingUp, AlertOctagon } from 'lucide-react'
import { FadeIn, StaggerChildren, StaggerItem } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

const REPORT_TYPES = [
  { key: 'turnover', label: 'Inventory Turnover', icon: TrendingUp, description: 'How quickly stock moves' },
  { key: 'dead-stock', label: 'Dead Stock', icon: AlertOctagon, description: 'Items with zero movement' },
  { key: 'demand-trends', label: 'Demand Trends', icon: BarChart2, description: 'Historical demand patterns' },
]

export default function Reports() {
  const [activeReport, setActiveReport] = useState('turnover')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30')

  const fetchReport = async (type) => {
    setLoading(true)
    setData([])
    try {
      const r = await api.get(`/reports/${type}`, { params: { days: period } })
      setData(r.data?.data || r.data || [])
    } catch (err) {
      console.error('Report error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport(activeReport) }, [activeReport, period])

  const current = REPORT_TYPES.find(r => r.key === activeReport)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Inventory analytics and insights</p>
        </div>
        <div className="page-actions">
          <select className="form-select" style={{ width: 160 }} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      <FadeIn>
        {/* Report Type Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {REPORT_TYPES.map(r => {
            const Icon = r.icon
            const isActive = activeReport === r.key
            return (
              <button key={r.key} onClick={() => setActiveReport(r.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                  borderRadius: 12, border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent-soft)' : 'var(--bg-card)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: isActive ? 'var(--accent)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Report Table */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>
            {current?.label} — Last {period} Days
          </div>
          {loading ? (
            <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading report…</div>
          ) : data.length === 0 ? (
            <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>
              <BarChart2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No data available for this period.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {activeReport === 'turnover' && <><th>Product</th><th>SKU</th><th>Units Sold</th><th>Turnover Rate</th><th>Avg Stock</th></>}
                    {activeReport === 'dead-stock' && <><th>Product</th><th>SKU</th><th>Stock Level</th><th>Days Idle</th><th>Category</th></>}
                    {activeReport === 'demand-trends' && <><th>Product</th><th>SKU</th><th>Period</th><th>Demand</th><th>Trend</th></>}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      {activeReport === 'turnover' && (
                        <>
                          <td style={{ fontWeight: 500 }}>{row.productName || row.product?.name}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{row.sku || row.product?.sku}</td>
                          <td>{row.unitsSold ?? row.sold ?? 0}</td>
                          <td>
                            <span className={`badge badge-${(row.turnoverRate ?? 0) > 2 ? 'done' : 'waiting'}`}>
                              {(row.turnoverRate ?? 0).toFixed(2)}×
                            </span>
                          </td>
                          <td>{row.avgStock ?? row.averageStock ?? 0}</td>
                        </>
                      )}
                      {activeReport === 'dead-stock' && (
                        <>
                          <td style={{ fontWeight: 500 }}>{row.productName || row.product?.name}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{row.sku || row.product?.sku}</td>
                          <td style={{ fontWeight: 700, color: 'var(--status-waiting)' }}>{row.stockLevel ?? row.currentStock ?? 0}</td>
                          <td><span className="badge badge-cancelled">{row.daysIdle ?? row.daysSinceLastMovement ?? 0}d</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{row.categoryName || row.category?.name || '—'}</td>
                        </>
                      )}
                      {activeReport === 'demand-trends' && (
                        <>
                          <td style={{ fontWeight: 500 }}>{row.productName || row.product?.name}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{row.sku || row.product?.sku}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{row.period}</td>
                          <td>{row.demand ?? row.quantity ?? 0}</td>
                          <td>
                            {(row.trend ?? 0) > 0
                              ? <span style={{ color: 'var(--status-done)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={14} />+{row.trend}%</span>
                              : <span style={{ color: 'var(--status-cancelled)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingDown size={14} />{row.trend}%</span>}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
