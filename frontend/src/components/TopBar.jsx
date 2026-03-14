import { useLocation } from 'react-router-dom'
import { Bell, Search, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styles from './TopBar.module.css'

const routeLabels = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of inventory operations' },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/products/new': { title: 'New Product', subtitle: 'Add a product to inventory' },
  '/receipts': { title: 'Receipts', subtitle: 'Incoming stock from suppliers' },
  '/receipts/new': { title: 'New Receipt', subtitle: 'Record an incoming shipment' },
  '/delivery': { title: 'Delivery Orders', subtitle: 'Outgoing stock to customers' },
  '/delivery/new': { title: 'New Delivery', subtitle: 'Create a delivery order' },
  '/adjustments': { title: 'Inventory Adjustments', subtitle: 'Fix stock discrepancies' },
  '/move-history': { title: 'Move History', subtitle: 'Complete stock movement ledger' },
  '/settings': { title: 'Settings', subtitle: 'Configure warehouses & preferences' },
}

const createRoutes = {
  '/products': '/products/new',
  '/receipts': '/receipts/new',
  '/delivery': '/delivery/new',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const info = routeLabels[pathname] || { title: 'INVENTRA', subtitle: '' }
  const createTarget = createRoutes[pathname]

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>{info.title}</h1>
        {info.subtitle && <span className={styles.subtitle}>{info.subtitle}</span>}
      </div>
      <div className={styles.right}>
        <div className={styles.search}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search…" />
        </div>
        {createTarget && (
          <button className={styles.newBtn} onClick={() => navigate(createTarget)}>
            <Plus size={15} />
            <span>New</span>
          </button>
        )}
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={17} />
          <span className={styles.notifDot} />
        </button>
      </div>
    </header>
  )
}
