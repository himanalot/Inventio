"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronRight, CheckCircle, MessageSquare, Calculator, Atom, Code2, TestTube, HeartPulse, Users, Clock, Calendar, GraduationCap, MessageCircle, Star, Wallet, Home, History, Calendar as CalendarIcon, Bookmark, BarChart2, MessageSquare as MessageSquareIcon, Settings, FileText, FileSpreadsheet, Search as SearchIcon, Book, BookOpen, FileQuestion, MessagesSquare, Bot, Sparkles, Plus, Library } from "lucide-react"
import { SiGradle } from "react-icons/si"
import { RiGraduationCapFill } from "react-icons/ri"
import { PortfolioCardStack } from "@/app/cardstackstuff/portfolio-card-stack"
import MobileDetectionOverlay from "@/components/MobileDetectionOverlay"
import { 
  Braces,
  Network,
  Zap,
  Brain,
  Workflow,
  GitBranch
} from "lucide-react"

// Mock tutor database for search
const MOCK_TUTORS = [
  {
    id: "t1",
    name: "Alicia Zhang",
    subject: "Calculus, Linear Algebra",
    rating: 4.9,
    reviews: 42,
    hourlyRate: 25,
    image: "https://randomuser.me/api/portraits/women/33.jpg"
  },
  {
    id: "t2",
    name: "Marcus Johnson",
    subject: "Physics, Chemistry",
    rating: 4.8,
    reviews: 38,
    hourlyRate: 30,
    image: "https://randomuser.me/api/portraits/men/54.jpg"
  },
  {
    id: "t3",
    name: "Sophia Martinez",
    subject: "Computer Science, Data Structures",
    rating: 5.0,
    reviews: 27,
    hourlyRate: 35,
    image: "https://randomuser.me/api/portraits/women/67.jpg"
  },
  {
    id: "t4",
    name: "David Kim",
    subject: "Organic Chemistry, Biochemistry",
    rating: 4.7,
    reviews: 53,
    hourlyRate: 28,
    image: "https://randomuser.me/api/portraits/men/22.jpg"
  },
  {
    id: "t5",
    name: "Emily Rodriguez",
    subject: "Economics, Statistics",
    rating: 4.9,
    reviews: 31,
    hourlyRate: 32,
    image: "https://randomuser.me/api/portraits/women/45.jpg"
  }
];

// Portfolio items for the card stack - updated to be relevant to PDF library
const portfolioItems = [
  {
    ticker: "LIB",
    companyName: "Access Library",
    logoUrl: "",
    icon: BookOpen,
    logoBlurColor: "rgba(99, 102, 241, 0.2)", // Indigo for library
    price: "",
    change: "",
    changePercent: "",
    isPositive: true,
    brokerLogoUrl: "/placeholder.svg",
    brokerName: "View All Documents",
    onClick: undefined // This will be assigned in the component
  }
]

export default function LandingPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showMainContent, setShowMainContent] = useState(false)
  const [hasVisitedBefore, setHasVisitedBefore] = useState(false) // Default to false until we check localStorage
  const [conversationStep, setConversationStep] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [searchResults, setSearchResults] = useState<typeof MOCK_TUTORS>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Check if user has visited before
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('hasVisitedBefore')
      
      if (hasVisited) {
        // If they've visited before, skip the chat and show main content directly
        setHasVisitedBefore(true)
        setShowMainContent(true)
      } else {
        // First time visitor - show the chat and set the flag for future visits
        setHasVisitedBefore(false)
        localStorage.setItem('hasVisitedBefore', 'true')
      }
    }
  }, [])
  
  // Avatar images for chat
  const avatars = {
    alex: "https://randomuser.me/api/portraits/men/32.jpg",
    jordan: "https://randomuser.me/api/portraits/women/44.jpg",
  }
  
  // Chat conversation sequence
  const chatMessages = [
    { id: 1, sender: "alex", text: "Hey, how'd your Calculus midterm go?" },
    { id: 2, sender: "jordan", text: "Not great 😞 I got a C-. I'm really struggling with derivatives." },
    { id: 3, sender: "alex", text: "Sorry to hear that. Have you thought about getting a tutor?" },
    { id: 4, sender: "jordan", text: "Yeah, but all the tutoring centers are booked for weeks, and private tutors are way too expensive" },
    { id: 5, sender: "alex", text: "You should try Mentori! It's this platform where you can find peer tutors who've aced the same classes" },
    { id: 6, sender: "jordan", text: "Really? Are they any good?" },
    { id: 7, sender: "alex", text: "Definitely! I used it for Organic Chemistry last semester. They match you with students who've taken the exact same class and done well" },
    { id: 8, sender: "alex", text: "Plus it's way more affordable than professional tutors" },
    { id: 9, sender: "jordan", text: "That sounds perfect. Where do I sign up?" },
    { id: 10, sender: "alex", text: "Just check out mentori.edu - you can search for Calculus tutors right away" },
    { id: 11, sender: "system", text: "Connecting students with qualified peer tutors..." },
  ]
  
  // Auto-advance the conversation only for first-time visitors
  useEffect(() => {
    if (!hasVisitedBefore) {
      if (conversationStep < chatMessages.length) {
        const timer = setTimeout(() => {
          setConversationStep(prev => prev + 1)
        }, conversationStep === 0 ? 500 : 1500)
        
        return () => clearTimeout(timer)
      } else {
        // After conversation ends, wait and then show main content
        const timer = setTimeout(() => {
          setShowMainContent(true)
        }, 2000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [conversationStep, hasVisitedBefore])
  
  // Scroll to the bottom of the chat as new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationStep])
  
  // Mock search function
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    // Simulate searching delay
    setTimeout(() => {
      const results = MOCK_TUTORS.filter(tutor => 
        tutor.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      setSearchResults(results)
      setIsSearching(false)
    }, 800)
  }
  
  // Navigation handler
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  // Navigation handler for PDF Thumbnails
  const handleNavigateToThumbnails = () => {
    // Navigate directly to thumbnails page
    router.push('/pdf/thumbnails')
  }

  // Update the portfolio items with the proper onClick functions
  const portfolioItemsWithHandlers = portfolioItems.map(item => {
    if (item.ticker === "LIB") {
      return {
        ...item,
        onClick: handleNavigateToThumbnails
      }
    }
    return item
  })

  return (
    <main className="min-h-screen w-full bg-background relative overflow-hidden">
      <MobileDetectionOverlay />
      
      {/* Background */}
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
      
      {/* Hero section with card stack */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="font-interDisplay font-semibold leading-[100%] text-[56px] md:text-[64px] max-w-[820px] mt-5 !tracking-[-0.03em] text-center whitespace-nowrap">Inventio is AI for researchers</h1>
          <p className="lg:text-[22px] lg:leading-[30px] md:text-xl md:leading-[27px] text-lg leading-6 max-w-[750px] mt-4 text-center text-gray-600">Analyze research papers and extract key insights with powerful <span className="whitespace-nowrap">open-source</span> AI research assistance.</p>
          <div className="w-full max-w-[486px] mt-8">
            <PortfolioCardStack 
              portfolioItems={portfolioItemsWithHandlers}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Simplified loader animation */
        .loader-gray {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-block;
          position: relative;
          border: 2px solid;
          border-color: #888 #888 transparent transparent;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        
        .loader-gray::after,
        .loader-gray::before {
          content: '';  
          box-sizing: border-box;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid transparent;
          box-sizing: border-box;
        }

        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @media (prefers-reduced-motion) {
          button {
            transition: none !important;
          }
          
          .loader-gray {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  )
} 