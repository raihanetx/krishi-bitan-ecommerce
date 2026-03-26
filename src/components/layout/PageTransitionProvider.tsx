'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProviderProps {
  children: ReactNode
}

// Smooth but fast page transitions - elegant yet performant
export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    // Skip on first mount
    if (displayChildren === children) return
    
    // Start exit animation
    setIsTransitioning(true)
    
    // Quick transition - 120ms for exit
    const exitTimer = setTimeout(() => {
      setDisplayChildren(children)
      // 80ms for enter
      const enterTimer = setTimeout(() => {
        setIsTransitioning(false)
      }, 80)
      return () => clearTimeout(enterTimer)
    }, 120)
    
    return () => clearTimeout(exitTimer)
  }, [pathname, children])

  return (
    <div
      style={{
        opacity: isTransitioning ? 0.7 : 1,
        transition: 'opacity 0.12s ease-out',
        willChange: 'opacity',
      }}
    >
      {displayChildren}
    </div>
  )
}
