'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'

interface PageTransitionProviderProps {
  children: ReactNode
}

// SMART: Ultra-fast page transitions - instant feel
// Only 150ms for enter, 100ms for exit (feels instant)
const pageVariants: Variants = {
  initial: {
    opacity: 1, // Start visible for instant feel
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0, // Instant - no animation delay
    },
  },
  exit: {
    opacity: 0.7, // Subtle fade out
    transition: {
      duration: 0.1, // Very fast 100ms exit
      ease: 'easeOut',
    },
  },
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
