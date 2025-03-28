"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Text, RoundedBox, Svg } from "@react-three/drei"
import * as THREE from "three"

interface CubeSlicesProps {
  slices: number
  maxSlices: number
  autoRotate?: boolean
  rotationSpeed?: number
  labels?: string[]
  colors?: string[]
}

export default function CubeSlices({ 
  slices, 
  maxSlices, 
  autoRotate = true, 
  rotationSpeed = 0.003,
  labels = [],
  colors: customColors
}: CubeSlicesProps) {
  const groupRef = useRef<THREE.Group>(null)

  // SVG paths for icons
  const svgIcons = {
    DATA: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 9c0-1.5.5-2 2-2h12c1.5 0 2 .5 2 2v6c0 1.5-.5 2-2 2H6c-1.5 0-2-.5-2-2V9zm2 0v6h12V9H6z" fill="currentColor"/>
      <path d="M3 4c0-1.5.5-2 2-2h14c1.5 0 2 .5 2 2s-.5 2-2 2H5c-1.5 0-2-.5-2-2z" fill="currentColor"/>
      <path d="M3 20c0-1.5.5-2 2-2h14c1.5 0 2 .5 2 2s-.5 2-2 2H5c-1.5 0-2-.5-2-2z" fill="currentColor"/>
    </svg>`,

    INTEGRATIONS: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2H5a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM19 2h-4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM9 14H5a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2zM19 14h-4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 9v4a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 14v-5" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,

    ANALYTICS: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12h4v8H3v-8zM9 8h4v12H9V8zM15 4h4v16h-4V4zM3 6a3 3 0 013-3h12a3 3 0 013 3v1H3V6z" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,

    AI: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12a3 3 0 100-6 3 3 0 000 6zM15 12a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M9 15c-2.25 0-6 1.13-6 3.75V19h12v-.25C15 16.13 11.25 15 9 15zM15 15c-1.05 0-2.33.23-3.43.7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M18 19v-.25c0-2.62-3.75-3.75-6-3.75" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,

    ACTIONS: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2l-1 7h6l-8 13 1-8H5l8-12z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    MESSAGES: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12a8 8 0 1114.32 4.73l-1.47 1.47a2 2 0 00-.56 1.38l-.16 1.68a1 1 0 01-1.1.82l-3.54-.71a1 1 0 00-.33-.04A8 8 0 014 12z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M9 12.5h6M9 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  }
  
  // Generate colors for each slice if not provided
  const colors = useMemo(() => {
    if (customColors && customColors.length >= maxSlices) {
      return customColors.map(color => new THREE.Color(color))
    }
    
    // More blue-toned colors based on the reference image
    return [
      new THREE.Color("#ffffff"), // White
      new THREE.Color("#ffffff"), // White
      new THREE.Color("#ffffff"), // White
      new THREE.Color("#ffffff"), // White
      new THREE.Color("#ffffff"), // White
      new THREE.Color("#ffffff"), // White
    ]
  }, [maxSlices, customColors])

  // Layout in a grid - but in a smart way to maintain the look from the reference
  const positions = [
    // First row
    {x: -0.85, z: -0.85, y: 0.1},  // Top left 
    {x: 0, z: -0.85, y: 0.05},      // Top center
    {x: 0.85, z: -0.85, y: 0.15},  // Top right
    // Second row  
    {x: -0.85, z: 0, y: 0.05},     // Middle left
    {x: 0, z: 0, y: 0.2},          // Middle center (raised higher)
    {x: 0.85, z: 0, y: 0.1},       // Middle right
    // Third row
    {x: -0.85, z: 0.85, y: 0.15},  // Bottom left
    {x: 0, z: 0.85, y: 0.1},       // Bottom center
    {x: 0.85, z: 0.85, y: 0.05},   // Bottom right
  ]

  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += rotationSpeed
    }
  })

  return (
    <group ref={groupRef}>
      {/* Base platform */}
      <group position={[0, -0.1, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[2, 2.1, 0.05, 32]} />
          <meshStandardMaterial 
            color="#f1f5f9" 
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        
        {/* Light glow from center */}
        <pointLight position={[0, 0.5, 0]} intensity={0.6} color="#ffffff" distance={3} />
      </group>
      
      {/* Connection hub */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#cbd5e1" 
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      
      {/* Blocks in grid layout */}
      {positions.slice(0, maxSlices).map((position, index) => {
        const isActive = index < slices
        const label = labels[index] || `Slice ${index + 1}`
        const matchedKey = Object.keys(svgIcons).find(key => label.includes(key))
        const iconKey = (matchedKey || "DATA") as keyof typeof svgIcons
        
        // Calculate connector positions
        const connectorStart = new THREE.Vector3(position.x, position.y, position.z)
        const connectorEnd = new THREE.Vector3(0, 0.1, 0) // Center hub
        const connectorDirection = new THREE.Vector3().subVectors(connectorEnd, connectorStart).normalize()
        const blockEdgePoint = new THREE.Vector3().copy(connectorStart).add(
          connectorDirection.clone().multiplyScalar(0.5) // Distance from block center to edge
        )
        
        return (
          <group 
            key={index} 
            position={[0, 0, 0]}
            visible={true}
          >
            {/* Connection lines to hub */}
            {isActive && (
              <>
                <primitive 
                  object={new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints([
                      blockEdgePoint,
                      connectorEnd
                    ]),
                    new THREE.LineBasicMaterial({ 
                      color: "#94a3b8",  
                      linewidth: 1.5,
                      opacity: 0.6,
                      transparent: true,
                    })
                  )}
                />
                
                {/* Small connector node */}
                <mesh position={blockEdgePoint} castShadow>
                  <sphereGeometry args={[0.04, 16, 16]} />
                  <meshStandardMaterial 
                    color="#64748b" 
                    roughness={0.2}
                    metalness={0.7}
                  />
                </mesh>
              </>
            )}
            
            {/* The Block */}
            <group 
              position={[position.x, isActive ? position.y : -0.5, position.z]} 
              scale={isActive ? 1 : 0.8}
            >
              {/* Main block body */}
              <RoundedBox 
                args={[0.7, 0.12, 0.7]} 
                radius={0.04} 
                smoothness={4} 
                receiveShadow 
                castShadow
              >
                <meshPhysicalMaterial 
                  color={isActive ? colors[index % colors.length] : "#e2e8f0"} 
                  roughness={0.05}
                  metalness={0.1}
                  clearcoat={0.8}
                  clearcoatRoughness={0.2}
                  transmission={0}
                  opacity={isActive ? 1 : 0.3}
                  transparent={!isActive}
                  side={THREE.DoubleSide}
                />
              </RoundedBox>
              
              {/* Icon on top */}
              {isActive && (
                <Svg 
                  src={svgIcons[iconKey]} 
                  position={[0, 0.065, 0]} 
                  scale={0.15}
                  rotation={[-Math.PI / 2, 0, 0]}
                  fillMaterial={{ color: "#334155" }}
                  strokeMaterial={{ color: "#334155" }}
                />
              )}
              
              {/* Label below block */}
              <Text
                position={[0, -0.13, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.06}
                color="#64748b"
                font="/fonts/Inter-Bold.woff"
                anchorX="center"
                anchorY="middle"
              >
                {label}
              </Text>
              
              {/* Shadow beneath block */}
              <mesh 
                position={[0, -0.08, 0]} 
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.8, 0.8]} />
                <meshBasicMaterial 
                  color="#94a3b8" 
                  transparent={true} 
                  opacity={0.05} 
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
} 