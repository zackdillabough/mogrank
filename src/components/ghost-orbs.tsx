"use client"

import { useEffect, useState } from "react"

interface Orb {
  id: number
  x: number
  size: number
  duration: number
  delay: number
  opacity: number
  drift: number
}

export function GhostOrbs() {
  const [orbs, setOrbs] = useState<Orb[]>([])

  useEffect(() => {
    const generated: Orb[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 3 + Math.random() * 6,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * -20,
      opacity: 0.12 + Math.random() * 0.18,
      drift: -20 + Math.random() * 40,
    }))
    setOrbs(generated)
  }, [])

  if (orbs.length === 0) return null

  return (
    <div className="absolute top-0 left-0 right-0 h-screen pointer-events-none overflow-hidden" aria-hidden="true">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full animate-orb-fall"
          style={{
            left: `${orb.x}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            opacity: orb.opacity,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
            "--orb-drift": `${orb.drift}px`,
            background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,220,255,0.4) 40%, transparent 70%)`,
            boxShadow: `0 0 ${orb.size}px ${orb.size * 0.3}px rgba(200,220,255,0.15)`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
