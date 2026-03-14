import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, PackagePlus, TruckIcon,
  ClipboardList, History, Settings, User, LogOut,
  ChevronRight, Menu, X, Box,
  FolderOpen, AlertTriangle, Truck, ShoppingCart,
  BarChart2, Tag, Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import styles from './Sidebar.module.css'

const nav = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: 'Catalog',
    icon: Package,
    roles: ['INVENTORY_MANAGER'],
    children: [
      { label: 'Products', to: '/products', icon: Box },
      { label: 'Suppliers', to: '/suppliers', icon: Truck },
    ],
  },
  {
    label: 'Purchases',
    icon: ShoppingCart,
    roles: ['INVENTORY_MANAGER'],
    children: [
      { label: 'Purchase Orders', to: '/purchase-orders', icon: ClipboardList },
    ],
  },
  {
    label: 'Operations',
    icon: FolderOpen,
    children: [
      { label: 'Receipts (GRN)', to: '/receipts', icon: PackagePlus },
      { label: 'Delivery Orders', to: '/delivery', icon: TruckIcon },
      { label: 'Adjustments', to: '/adjustments', icon: AlertTriangle },
      { label: 'Move History', to: '/move-history', icon: History },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart2,
    to: '/reports',
    roles: ['INVENTORY_MANAGER'],
  },
  {
    label: 'Settings',
    icon: Settings,
    to: '/settings',
    roles: ['INVENTORY_MANAGER'],
  },
]

function NavItem({ item, collapsed }) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon

  if (item.children) {
    return (
      <div className={styles.group}>
        <button
          className={`${styles.navBtn} ${open ? styles.navBtnActive : ''}`}
          onClick={() => setOpen(o => !o)}
          title={collapsed ? item.label : undefined}
        >
          <Icon size={18} className={styles.navIcon} />
          {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          {!collapsed && (
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className={styles.chevron}
            >
              <ChevronRight size={14} />
            </motion.span>
          )}
        </button>
        <AnimatePresence>
          {open && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={styles.subMenu}
            >
              {item.children.map(child => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  className={({ isActive }) =>
                    `${styles.subLink} ${isActive ? styles.subLinkActive : ''}`
                  }
                >
                  <child.icon size={14} />
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
      }
    >
      <Icon size={18} className={styles.navIcon} />
      {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={styles.sidebar}
    >
      {/* Logo */}
      <div className={styles.logo}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={styles.logoText}
          >
            <span className={styles.logoBrand}>INVENTRA</span>
          </motion.div>
        )}
        {collapsed && (
          <div className={styles.logoIcon}>CI</div>
        )}
        <button className={styles.collapseBtn} onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {nav
          .filter(item => !item.roles || item.roles.includes(user?.role))
          .map(item => (
            <NavItem key={item.label} item={item} collapsed={collapsed} />
          ))}
      </nav>

      {/* Profile Section */}
      <div className={styles.profile}>
        <div className={styles.avatar}>
          <User size={16} />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.profileInfo}
          >
            <span className={styles.profileName}>{user?.name || user?.email || 'User'}</span>
            <span className={styles.profileRole}>{user?.role || 'Inventory Manager'}</span>
          </motion.div>
        )}
        {!collapsed && (
          <button className={styles.logoutBtn} onClick={logout} title="Logout">
            <LogOut size={15} />
          </button>
        )}
      </div>
    </motion.aside>
  )
}
