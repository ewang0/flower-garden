"use client"

import { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Html } from "@react-three/drei"
import * as THREE from "three"
import type { PlantedFlower } from "@/lib/flower-storage"
import { WaterDroplets } from "./water-droplets"

interface FlowerProps {
  petalCount: number
  petalLength: number
  petalWidth: number
  stemHeight: number
  petalColor: string
  centerColor: string
  stemColor: string
  seed: number
  isPlanted?: boolean
  username?: string
  position?: [number, number, number]
  lastWatered?: number
  id?: string
}

interface FieldProps {
  plantedFlowers: PlantedFlower[]
  wateredFlowerId?: string | null
}

// Create a simple grass blade as a vertical rectangular plane
function GrassBlade({
  position,
  height = 0.3,
  color = "#4a1e66",
}: { position: [number, number, number]; height?: number; color?: string }) {
  // Random rotation around Y axis to vary orientation
  const rotationY = Math.random() * Math.PI * 2
  // Slight random tilt
  const tiltX = (Math.random() - 0.5) * 0.2

  return (
    <mesh position={position} rotation={[tiltX, rotationY, 0]}>
      <planeGeometry args={[0.05, height]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent={true} opacity={0.9} />
    </mesh>
  )
}

// Create a simple dandelion
function Dandelion({
  position,
  stemHeight = 0.4,
  seedOffset = 0,
}: { position: [number, number, number]; stemHeight?: number; seedOffset?: number }) {
  // Use seedOffset to create variation
  const random = (min: number, max: number) => min + (Math.sin(seedOffset * 100) * 0.5 + 0.5) * (max - min)

  // Slight random tilt
  const tiltX = (Math.random() - 0.5) * 0.3
  const tiltZ = (Math.random() - 0.5) * 0.3

  const stemColor = "#4a1e66"
  const flowerColor = "#f0f0e0"
  const emissiveIntensity = 0.2

  return (
    <group position={position} rotation={[tiltX, 0, tiltZ]}>
      {/* Stem */}
      <mesh position={[0, stemHeight / 2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, stemHeight, 4]} />
        <meshStandardMaterial color={stemColor} />
      </mesh>

      {/* Flower head (white/yellow puff) */}
      <mesh position={[0, stemHeight, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={flowerColor}
          roughness={0.8}
          emissive={flowerColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  )
}

function Field({ plantedFlowers = [], wateredFlowerId = null, size = 30 }: FieldProps & { size?: number }) {
  // Create grass blades and dandelions with memoization
  const vegetation = useMemo(() => {
    const items = []

    // Add simple grass blades
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * size - size / 2
      const z = Math.random() * size - size / 2

      // Vary the grass color slightly
      const colorVariation = Math.random() * 20 - 10
      const grassColor = `hsl(270, 60%, ${25 + colorVariation}%)`

      items.push(
        <GrassBlade key={`grass-${i}`} position={[x, 0.15, z]} height={0.2 + Math.random() * 0.2} color={grassColor} />,
      )
    }

    // Add a few dandelions
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size - size / 2
      const z = Math.random() * size - size / 2

      items.push(
        <Dandelion key={`dandelion-${i}`} position={[x, 0, z]} stemHeight={0.3 + Math.random() * 0.2} seedOffset={i} />,
      )
    }

    return items
  }, [size])

  return (
    <>
      {/* Ground - dark purple color with less reflectivity */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#331a4d" roughness={1.0} metalness={0.0} envMapIntensity={0.2} />
      </mesh>

      {/* Vegetation (grass and dandelions) */}
      {vegetation}

      {/* Add some random flowers in the background */}
      {Array.from({ length: 15 }).map((_, i) => {
        const x = Math.random() * size - size / 2
        const z = Math.random() * size - size / 2
        // Don't place flowers too close to the center
        if (Math.abs(x) < 3 && Math.abs(z) < 3) return null

        const scale = 0.3 + Math.random() * 0.4
        return (
          <mesh key={i} position={[x, 0, z]} scale={[scale, scale, scale]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color={`hsl(${Math.random() * 360}, 70%, 60%)`} roughness={0.7} />
          </mesh>
        )
      })}

      {/* Planted flowers */}
      {plantedFlowers.map((flower) => (
        <PlantedFlowerWithLabel
          key={flower.id}
          {...flower}
          position={flower.position}
          username={flower.username}
          lastWatered={flower.lastWatered}
          id={flower.id}
        />
      ))}
    </>
  )
}

function PlantedFlowerWithLabel(props: FlowerProps) {
  const [hovered, setHovered] = useState(false)
  const [showWaterAnimation, setShowWaterAnimation] = useState(false)
  const [lastWateredTime, setLastWateredTime] = useState<number | undefined>(props.lastWatered)
  const groupRef = useRef<THREE.Group>(null)

  // Calculate position with adjusted height for tall flowers
  const position: [number, number, number] = props.position
    ? [props.position[0], props.position[1], props.position[2]]
    : [0, 0, 0]

  // If the stem is tall, lower the flower position to keep it from getting too close to the top
  // Using a more subtle adjustment factor (0.15 instead of 0.3)
  if (props.stemHeight > 4) {
    // Only adjust for very tall flowers (> 4)
    position[1] = -Math.max(0, (props.stemHeight - 4) * 0.15)
  }

  // Check if flower was just watered
  useEffect(() => {
    if (props.lastWatered && props.lastWatered !== lastWateredTime) {
      setLastWateredTime(props.lastWatered)
      setShowWaterAnimation(true)
    }
  }, [props.lastWatered, lastWateredTime])

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Flower {...props} isPlanted={true} />

      {/* Water droplets animation */}
      <WaterDroplets
        active={showWaterAnimation}
        height={props.stemHeight}
        onComplete={() => setShowWaterAnimation(false)}
      />

      {/* Username label that appears on hover or when highlighted */}
      {hovered && props.username && (
        <Html position={[0, props.stemHeight + 1, 0]} center distanceFactor={8}>
          <div className="px-2 py-1 bg-black/70 text-white rounded text-sm whitespace-nowrap">{props.username}</div>
        </Html>
      )}
    </group>
  )
}

// Create a helper function to generate deterministic random numbers based on a seed
const createRandomGenerator = (seed: number) => {
  return (min: number, max: number, seedOffset = 0): number => {
    const x = Math.sin(seed + seedOffset) * 10000
    return min + (x - Math.floor(x)) * (max - min)
  }
}

function Flower({
  petalCount,
  petalLength,
  petalWidth,
  stemHeight,
  petalColor,
  centerColor,
  stemColor,
  seed,
  isPlanted = false,
}: FlowerProps) {
  const flowerGroup = useRef<THREE.Group>(null)
  const stemGroup = useRef<THREE.Group>(null)
  const petalGroup = useRef<THREE.Group>(null)

  // Create a memoized random generator based on the seed
  const random = useMemo(() => createRandomGenerator(seed), [seed])

  // Create unique wind parameters for this flower
  const windParams = useMemo(() => {
    return {
      speed: random(0.5, 1.5, 42),
      strength: random(0.05, 0.15, 13),
      turbulence: random(0.1, 0.3, 27),
      direction: random(0, Math.PI * 2, 99),
    }
  }, [random])

  // Create petals
  const petals = useMemo(() => {
    const items = []
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2
      const petalSeed = seed + i

      // Add some randomness to petal shape
      const length = petalLength * (0.9 + random(0, 0.2, petalSeed))
      const width = petalWidth * (0.9 + random(0, 0.2, petalSeed + 0.1))
      // Add more variance to the bend angle for each petal
      const baseBend = random(0.1, 0.3, petalSeed + 0.2)
      const bendVariance = random(-0.1, 0.1, petalSeed + i * 0.5)
      const bend = Math.max(0.05, baseBend + bendVariance)

      items.push(
        <mesh key={i} position={[0, 0, 0]} rotation={[Math.PI / 2 - bend, 0, angle]}>
          <planeGeometry args={[width * 2, length * 2]} />
          <meshStandardMaterial color={petalColor} side={THREE.DoubleSide} roughness={0.6} metalness={0.1} />
        </mesh>,
      )
    }
    return items
  }, [petalCount, petalLength, petalWidth, petalColor, seed, random])

  // Animate the flower with wind effect
  useFrame((state) => {
    if (!flowerGroup.current || !stemGroup.current || !petalGroup.current) return

    const time = state.clock.getElapsedTime()

    // Base wind movement
    const windX = Math.sin(time * windParams.speed) * windParams.strength
    const windZ = Math.cos(time * windParams.speed + 0.3) * windParams.strength * 0.7

    // Add turbulence
    const turbulenceX = Math.sin(time * 2.5 * windParams.speed) * windParams.turbulence * 0.05
    const turbulenceZ = Math.cos(time * 2.7 * windParams.speed) * windParams.turbulence * 0.04

    // Apply wind direction
    const directedWindX = (windX + turbulenceX) * Math.cos(windParams.direction)
    const directedWindZ = (windZ + turbulenceZ) * Math.sin(windParams.direction)

    // Stem bends in the wind (more at the top, less at the bottom)
    stemGroup.current.rotation.x = directedWindZ * 0.2
    stemGroup.current.rotation.z = -directedWindX * 0.2

    // Flower head follows the stem but with more movement
    flowerGroup.current.position.x = directedWindX * stemHeight * 0.2
    flowerGroup.current.position.z = directedWindZ * stemHeight * 0.2

    // Petals flutter slightly in the wind
    petalGroup.current.rotation.y = Math.sin(time * 3) * 0.03
    petalGroup.current.rotation.x = Math.cos(time * 2.5) * 0.02
    petalGroup.current.rotation.z = Math.sin(time * 4) * 0.01
  })

  return (
    <group position={[0, 0, 0]}>
      <group ref={stemGroup}>
        {/* Stem */}
        <mesh position={[0, stemHeight / 2, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.15, stemHeight, 8]} />
          <meshStandardMaterial color={stemColor} roughness={0.8} />
        </mesh>

        {/* Leaves */}
        <mesh position={[0, stemHeight * 0.3, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <planeGeometry args={[0.4, 0.8]} />
          <meshStandardMaterial color={stemColor} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, stemHeight * 0.6, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.4, 0.6]} />
          <meshStandardMaterial color={stemColor} side={THREE.DoubleSide} />
        </mesh>

        {/* Flower head group */}
        <group ref={flowerGroup} position={[0, stemHeight, 0]}>
          {/* Flower center */}
          <mesh>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color={centerColor} roughness={0.7} />
          </mesh>

          {/* Petals group */}
          <group ref={petalGroup}>{petals}</group>
        </group>
      </group>
    </group>
  )
}

function CameraController({
  isPlanted,
  focusedFlowerPosition,
  wateredFlowerId,
  plantedFlowers = [],
  stemHeight = 3, // Default stem height
}: {
  isPlanted: boolean
  focusedFlowerPosition?: [number, number, number] | null
  wateredFlowerId?: string | null
  plantedFlowers?: PlantedFlower[]
  stemHeight?: number
}) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  // Find the watered flower position
  const wateredFlowerPosition = useMemo(() => {
    if (!wateredFlowerId || !plantedFlowers.length) return null
    const wateredFlower = plantedFlowers.find((flower) => flower.id === wateredFlowerId)
    return wateredFlower ? wateredFlower.position : null
  }, [wateredFlowerId, plantedFlowers])

  useEffect(() => {
    if (isPlanted) {
      // If a flower is being watered, focus on it
      if (wateredFlowerPosition) {
        const [x, y, z] = wateredFlowerPosition

        // Position the camera to view the watered flower from further away and more downward
        camera.position.set(x + 7, 9, z + 7) // Further away and higher up for more downward angle
        camera.lookAt(x, y + 2, z) // Look at a point slightly above the flower to center it better

        if (controlsRef.current) {
          controlsRef.current.target.set(x, y + 2, z)
        }
      }
      // Otherwise, if a flower was just planted, focus on that
      else if (focusedFlowerPosition) {
        const [x, y, z] = focusedFlowerPosition

        camera.position.set(x + 8, 8, z + 8)
        camera.lookAt(x, y, z)

        if (controlsRef.current) {
          controlsRef.current.target.set(x, y, z)
        }
      }
      // Default garden view
      else {
        camera.position.set(8, 8, 8)
        camera.lookAt(0, 0, 0)

        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0)
        }
      }
    } else {
      // Single flower view logic remains the same
      const flowerTotalHeight = stemHeight + 1
      const cameraHeight = Math.max(5, flowerTotalHeight * 1.2)
      const cameraDistance = Math.max(4, flowerTotalHeight * 1.0)

      camera.position.set(0, cameraHeight, cameraDistance)

      const lookAtHeight = stemHeight * 0.3
      camera.lookAt(0, lookAtHeight, 0)

      if (controlsRef.current) {
        controlsRef.current.target.set(0, lookAtHeight, 0)
      }
    }
  }, [isPlanted, camera, focusedFlowerPosition, stemHeight, wateredFlowerPosition])

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={isPlanted ? 30 : Math.max(15, stemHeight * 3)}
      minPolarAngle={isPlanted ? 0.1 : 0}
      maxPolarAngle={isPlanted ? Math.PI / 2 - 0.1 : Math.PI}
    />
  )
}

interface FlowerSceneProps extends FlowerProps {
  plantedFlowers?: PlantedFlower[]
  focusedFlowerPosition?: [number, number, number] | null
  sidebarVisible?: boolean
  wateredFlowerId?: string | null
  onLoad?: () => void
}

export function FlowerScene(props: FlowerSceneProps) {
  const {
    isPlanted = false,
    plantedFlowers = [],
    focusedFlowerPosition = null,
    stemHeight = 3,
    sidebarVisible = false,
    wateredFlowerId = null,
    onLoad,
  } = props

  // Call onLoad when the component mounts
  useEffect(() => {
    if (onLoad) {
      onLoad()
    }
  }, [onLoad])

  // Calculate the y-position offset based on stem height for the single flower view
  // Using a more subtle adjustment factor (0.25 instead of 0.5)
  const singleFlowerYOffset = -Math.max(0.5, stemHeight * 0.25)

  const ambientLightIntensity = 0.35
  const directionalLightIntensity = 0.85

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 4], fov: 50 }} // Initial camera position with more downward angle
      className={`bg-gradient-to-b from-purple-200 to-purple-300 ${isPlanted ? "w-full h-full" : "w-full h-full"}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <ambientLight intensity={ambientLightIntensity} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <directionalLight
        position={[5, 10, 5]}
        intensity={directionalLightIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {isPlanted && <Field plantedFlowers={plantedFlowers} wateredFlowerId={wateredFlowerId} />}
      {!isPlanted && (
        <group position={[0, singleFlowerYOffset, 0]}>
          <Flower {...props} />
        </group>
      )}

      <Environment preset={"night"} />
      <CameraController
        isPlanted={isPlanted}
        focusedFlowerPosition={focusedFlowerPosition}
        stemHeight={stemHeight}
        wateredFlowerId={wateredFlowerId}
        plantedFlowers={plantedFlowers}
      />
    </Canvas>
  )
}

export default FlowerScene
