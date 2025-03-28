"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  ContactShadows, 
  Preload, 
  Grid, 
  SoftShadows 
} from "@react-three/drei"
import CubeSlices from "./CubeSlices"

// Add soft shadows component for better visual quality

interface CubeSceneProps {
  slices: number
  maxSlices: number
  autoRotate?: boolean
  labels?: string[]
  colors?: string[]
}

export default function CubeScene({ 
  slices, 
  maxSlices, 
  autoRotate = true,
  labels,
  colors
}: CubeSceneProps) {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 5, 4], fov: 30 }}>
        <SoftShadows size={25} samples={16} />
        <color attach="background" args={["#f8fafc"]} />
        
        {/* Better initial camera positioning for top-down view */}
        <PerspectiveCamera makeDefault position={[0, 5, 3]} fov={30} />
        
        {/* Enhanced controls for better user interaction */}
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
          autoRotate={false}
          enableZoom={true}
          maxDistance={10}
          minDistance={2}
        />
        
        {/* Clean, minimal lighting setup */}
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[5, 8, 3]} 
          intensity={0.9} 
          castShadow 
          shadow-mapSize={1024}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <directionalLight position={[-5, 2, -1]} intensity={0.3} />
        
        {/* Soft spot light for accent */}
        <spotLight 
          position={[0, 6, 0]} 
          angle={0.4} 
          intensity={0.5} 
          penumbra={0.8} 
          castShadow 
          shadow-mapSize={1024}
        />
        
        {/* Main content */}
        <Suspense fallback={null}>
          <CubeSlices 
            slices={slices} 
            maxSlices={maxSlices} 
            autoRotate={autoRotate}
            labels={labels}
            colors={colors}
          />
          
          {/* Grid for visual reference */}
          <Grid 
            position={[0, -0.1, 0]}
            args={[20, 20]} 
            cellSize={0.5} 
            cellThickness={0.5}
            cellColor="#e2e8f0"
            sectionSize={3}
            sectionThickness={1}
            sectionColor="#cbd5e1"
            fadeDistance={15}
            fadeStrength={1}
          />
          
          {/* Subtle contact shadows for grounding */}
          <ContactShadows
            position={[0, -0.09, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={1}
            color="#94a3b8"
          />
          
          {/* Environment for nice reflections */}
          <Environment preset="city" />
          
          {/* Preload assets for better performance */}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
} 