"use client"

import { useState, useEffect } from "react"
import { PortfolioCardStack } from "@/app/cardstackstuff/portfolio-card-stack"
import { 
  Calculator, 
  Atom, 
  Code2, 
  TestTube, 
  HeartPulse,
  Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Mock portfolio items with academic subjects
const portfolioItems = [
  {
    ticker: "CALC",
    companyName: "Calculus II",
    logoUrl: "",
    icon: Calculator,
    logoBlurColor: "rgba(66, 135, 245, 0.2)", // Blue for Math
    price: "",
    change: "",
    changePercent: "",
    isPositive: true,
    brokerLogoUrl: "/placeholder.svg",
    brokerName: "Math Dept",
  },
  {
    ticker: "PHYS",
    companyName: "Physics Mechanics",
    logoUrl: "",
    icon: Atom,
    logoBlurColor: "rgba(75, 192, 192, 0.2)", // Teal for Physics
    price: "",
    change: "",
    changePercent: "",
    isPositive: true,
    brokerLogoUrl: "/placeholder.svg",
    brokerName: "Physics Dept",
  },
  {
    ticker: "CS",
    companyName: "Data Structures",
    logoUrl: "",
    icon: Code2,
    logoBlurColor: "rgba(153, 102, 255, 0.2)", // Purple for CS
    price: "",
    change: "",
    changePercent: "",
    isPositive: true,
    brokerLogoUrl: "/placeholder.svg",
    brokerName: "CS Dept",
  },
  {
    ticker: "CHEM",
    companyName: "Organic Chemistry",
    logoUrl: "",
    icon: TestTube,
    logoBlurColor: "rgba(255, 99, 132, 0.2)", // Red for Chemistry
    price: "",
    change: "",
    changePercent: "",
    isPositive: true,
    brokerLogoUrl: "/placeholder.svg",
    brokerName: "Chem Dept",
  },
  {
    ticker: "BIO",
    companyName: "Cell Biology",
    logoUrl: "",
    icon: HeartPulse,
    logoBlurColor: "rgba(75, 192, 75, 0.2)", // Green for Biology
    price: "",
    change: "",
    changePercent: "",
    isPositive: true,
    brokerLogoUrl: "/placeholder.svg",
    brokerName: "Bio Dept",
  },
]

export default function ExpandPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [filteredItems, setFilteredItems] = useState(portfolioItems)

  // Show search bar after initial animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSearch(true)
    }, 3500) // Adjust timing based on card animation duration

    return () => clearTimeout(timer)
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // Filter the cards based on search query
    const filtered = portfolioItems.filter(item => 
      item.companyName.toLowerCase().includes(query.toLowerCase()) ||
      item.ticker.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredItems(filtered)
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 w-full h-full">
        <div 
          className="absolute w-[1000px] h-[1000px] bg-blue-500/5 rounded-full blur-[100px]" 
          style={{ 
            left: '5%', 
            top: '15%',
            transform: 'translate(-50%, -50%)' 
          }}
        />
        <div 
          className="absolute w-[1000px] h-[1000px] bg-emerald-500/5 rounded-full blur-[100px]" 
          style={{ 
            right: '5%', 
            bottom: '15%',
            transform: 'translate(50%, 50%)' 
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-[540px]"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full h-16 pl-12 pr-5 bg-[rgba(19,19,19,0.85)] hover:bg-[rgba(30,30,30,0.85)] backdrop-blur-md rounded-2xl text-white border border-[rgba(255,255,255,0.06)] shadow-[0_0_44px_rgba(0,0,0,0.8)] outline-none appearance-none transition-colors duration-200 placeholder-slate-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card stack */}
        <div className="w-full max-w-[486px]">
          <PortfolioCardStack portfolioItems={filteredItems} />
        </div>
      </div>
    </main>
  )
} 