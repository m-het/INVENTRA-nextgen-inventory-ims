import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { FadeIn, StaggerChildren, StaggerItem } from '../components/Animated'
import api from '../services/api'
import '../styles/shared.css'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ])
        // API returns { value: [...], Count: N } or { data: [...] }
        setProducts(prodRes.data?.value || prodRes.data?.data || prodRes.data || [])
        setCategories(catRes.data?.value || catRes.data?.data || catRes.data || [])
      } catch (err) {
        console.error('Products fetch error', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const catNames = ['All', ...categories.map(c => c.name)]

  const filtered = products.filter(p =>
    (cat === 'All' || p.category?.name === cat || p.categoryName === cat) &&
    (p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Delete error', err)
    }
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { badge: 'cancelled', label: 'out of stock' }
    if (stock < 15) return { badge: 'waiting', label: 'low stock' }
    return { badge: 'done', label: 'available' }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>{loading ? '…' : `${products.length} total products in catalog`}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
            <Plus size={15} /> New Product
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Loading products…</div>
      ) : (
        <FadeIn>
          <div className="filter-bar" style={{ marginBottom: 12 }}>
            {catNames.map(c => (
              <button key={c} className={`filter-chip${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <span className="section-title" style={{ margin: 0 }}>Product List</span>
              <input
                className="form-input"
                style={{ width: 220 }}
                placeholder="Search by name / SKU…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th><th>Product Name</th><th>Category</th>
                    <th>Unit</th><th>In Stock</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No products found</td></tr>
                  ) : filtered.map(p => {
                    const stock = p.totalStock ?? p.stock ?? 0
                    const { badge, label } = getStockStatus(stock)
                    return (
                      <tr key={p.id || p.sku}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{p.sku}</td>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.category?.name || p.categoryName || '—'}</td>
                        <td>{p.unitOfMeasure || p.uom || '—'}</td>
                        <td style={{ fontWeight: 700, color: stock === 0 ? 'var(--status-cancelled)' : stock < 15 ? 'var(--status-waiting)' : 'var(--status-done)' }}>
                          {stock}
                        </td>
                        <td><span className={`badge badge-${badge}`}>{label}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => navigate(`/products/${p.id}`)}><Edit2 size={13} /></button>
                            <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => handleDelete(p.id)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
