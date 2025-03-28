"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Layers, Plus, Minus, RotateCw, RotateCcw, Info } from "lucide-react"
import CubeScene from "@/components/three/CubeScene"

export default function CubeSlicesDemo() {
  const [activeSlices, setActiveSlices] = useState(6) // Start with all slices active
  const [autoRotate, setAutoRotate] = useState(false) // Start without rotation
  const maxSlices = 6

  // Updated slice data to match reference image
  const slices = [
    {
      id: "slice1",
      title: "DATA",
      description: "Access database of 200,000+ peer tutors",
      color: "#f8fafc" // slate-50
    },
    {
      id: "slice2",
      title: "INTEGRATIONS",
      description: "Connect with your learning tools",
      color: "#f1f5f9" // slate-100
    },
    {
      id: "slice3",
      title: "ANALYTICS",
      description: "Track progress and performance",
      color: "#e2e8f0" // slate-200
    },
    {
      id: "slice4",
      title: "AI",
      description: "Smart tutor recommendations",
      color: "#f8fafc" // slate-50
    },
    {
      id: "slice5",
      title: "ACTIONS",
      description: "Use built-in tools for meetings",
      color: "#f1f5f9" // slate-100
    },
    {
      id: "slice6",
      title: "MESSAGES",
      description: "Communicate with your team",
      color: "#e2e8f0" // slate-200
    }
  ]

  const increment = () => {
    setActiveSlices(prev => Math.min(prev + 1, maxSlices))
  }

  const decrement = () => {
    setActiveSlices(prev => Math.max(prev - 1, 1))
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        increment()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        decrement()
      } else if (e.key === "r") {
        setAutoRotate(prev => !prev)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <a href="/" className="text-xl font-bold flex items-center">
              <span className="text-slate-900">Mentori</span>
              <span className="text-emerald-500">.</span>
            </a>
            <span className="text-slate-500 text-sm">/ Platform Components</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* 3D Visualization */}
        <div className="flex-1 h-[500px] md:h-auto">
          <CubeScene 
            slices={activeSlices} 
            maxSlices={maxSlices} 
            autoRotate={autoRotate}
            labels={slices.slice(0, maxSlices).map(s => s.title)}
            colors={slices.slice(0, maxSlices).map(s => s.color)}
          />
        </div>

        {/* Controls & Info */}
        <div className="w-full md:w-96 bg-slate-50 border-l border-slate-200 p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">Platform Components</h2>
          
          {/* Slice controls */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-slate-900">Active Components</h3>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span>{activeSlices}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-400">{maxSlices}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 mb-2">
              <Button
                variant="outline"
                size="icon"
                onClick={decrement}
                disabled={activeSlices <= 1}
                className="rounded-full border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
              >
                <Minus className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-slate-400 to-slate-600 h-2 rounded-full"
                  style={{ width: `${(activeSlices / maxSlices) * 100}%` }}
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={increment}
                disabled={activeSlices >= maxSlices}
                className="rounded-full border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRotate(prev => !prev)}
              className="w-full border-slate-300 bg-white hover:bg-slate-100 text-slate-900 mt-2"
            >
              {autoRotate ? <RotateCcw className="h-4 w-4 mr-2" /> : <RotateCw className="h-4 w-4 mr-2" />}
              {autoRotate ? "Stop Rotation" : "Start Rotation"}
            </Button>
          </div>
          
          {/* Component details */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2 text-slate-900">
              <Layers className="h-5 w-5" />
              <span>Component Details</span>
            </h3>
            
            <div className="space-y-1">
              {slices.slice(0, maxSlices).map((slice, index) => (
                <div 
                  key={slice.id} 
                  className={`p-3 border rounded-md transition-all ${
                    index < activeSlices 
                      ? 'border-slate-300 bg-white shadow-sm'
                      : 'border-slate-200 bg-slate-100 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {slice.title}
                    </h4>
                    <div className="w-3 h-3 rounded-full bg-slate-500" style={{ opacity: index < activeSlices ? 1 : 0.3 }} />
                  </div>
                  {index < activeSlices && (
                    <p className="text-xs text-slate-600 mt-1">{slice.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-slate-900">About this demo</h4>
                <p className="text-xs text-slate-600 mt-1">
                  This visualization demonstrates how different components 
                  of the platform work together as an integrated system.
                  Each component can be viewed independently or as part of
                  the whole ecosystem.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 text-center text-sm text-slate-500">
            Use the arrow keys to navigate<br />
            Press 'R' to toggle rotation
          </div>
        </div>
      </div>
    </div>
  )
} 