/**
 * ReactBits-style animated primitives
 * Using framer-motion for animations
 */
import { motion, AnimatePresence } from 'framer-motion'

/* ── FadeIn ─────────────────────────────────────────── */
export function FadeIn({ children, delay = 0, duration = 0.4, y = 16, className = '', style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ── SlideIn ─────────────────────────────────────────── */
export function SlideIn({ children, from = 'left', delay = 0, className = '' }) {
  const variants = {
    left:  { initial: { x: -40, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    right: { initial: { x:  40, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    up:    { initial: { y:  40, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    down:  { initial: { y: -40, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  }
  const v = variants[from]
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── ScaleIn ─────────────────────────────────────────── */
export function ScaleIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── StaggerChildren ────────────────────────────────── */
export function StaggerChildren({ children, stagger = 0.07, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── PageTransition ─────────────────────────────────── */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  )
}

/* ── GlowPulse ──────────────────────────────────────── */
export function GlowPulse({ children, className = '', color = 'rgba(224,36,36,0.18)' }) {
  return (
    <motion.div
      className={className}
      animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 28px ${color}`, `0 0 0px ${color}`] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/* ── AnimatedNumber ─────────────────────────────────── */
import { useEffect, useRef, useState } from 'react'
export function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const start = useRef(0)
  const startTime = useRef(null)

  useEffect(() => {
    start.current = 0
    startTime.current = null
    const target = Number(value)

    function tick(ts) {
      if (!startTime.current) startTime.current = ts
      const elapsed = ts - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <span>{display.toLocaleString()}</span>
}

/* ── Shimmer (loading skeleton) ─────────────────────── */
export function Shimmer({ width = '100%', height = 20, borderRadius = 6 }) {
  return (
    <motion.div
      style={{ width, height, borderRadius, background: 'linear-gradient(90deg,#1c1c28 25%,#2a2a3a 50%,#1c1c28 75%)', backgroundSize: '200% 100%' }}
      animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
    />
  )
}
