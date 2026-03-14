import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { PageTransition } from './Animated'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={styles.main}
        style={{ marginLeft: collapsed ? 64 : 240, transition: 'margin-left 0.3s cubic-bezier(0.22,1,0.36,1)' }}
      >
        <TopBar collapsed={collapsed} />
        <main className={styles.content}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
