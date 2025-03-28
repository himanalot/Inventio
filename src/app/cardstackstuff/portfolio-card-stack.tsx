"use client"

import { useState, useEffect } from "react"
import { PortfolioCard } from "./portfolio-card"
import { LucideIcon } from "lucide-react"

interface PortfolioItem {
  ticker: string
  companyName: string
  logoUrl: string
  logoBlurColor: string
  price: string
  change: string
  changePercent: string
  isPositive: boolean
  brokerLogoUrl: string
  brokerName: string
  icon: LucideIcon
  onClick?: () => void
}

interface PortfolioCardStackProps {
  portfolioItems: PortfolioItem[]
  searchQuery?: string
}

export function PortfolioCardStack({ portfolioItems, searchQuery = "" }: PortfolioCardStackProps) {
  const [mounted, setMounted] = useState(false)

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Simple rendering of cards without animations
  return (
    <div className="relative w-[486px] flex flex-col items-center justify-center gap-[6px] text-[14px]">
      {portfolioItems.map((item) => (
        <PortfolioCard key={item.ticker} {...item} />
      ))}
    </div>
  )
}

