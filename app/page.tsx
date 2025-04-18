"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ColorPicker } from "@/components/color-picker"
import { SignInForm } from "@/components/sign-in-form"
import { useUser } from "@/contexts/user-context"
import { getPlantedFlowers, plantFlower, loadFlowers, type PlantedFlower } from "@/lib/flower-storage"
import { Shuffle, PlusCircle, LogOut, Flower, Pencil, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { UserFlowersSidebar } from "@/components/user-flowers-sidebar"

// The previous approach still won't work because the loading component can't access component state
// Let's take a different approach by creating a wrapper component

// Replace the DynamicFlowerScene declaration with this:
const DynamicFlowerScene = dynamic(
  () => import("@/components/flower-scene").then((mod) => ({ default: mod.FlowerScene })),
  { ssr: false },
)

// Add this component before the Home component
function FlowerSceneWrapper({
  isLoading,
  isPlanted,
  sidebarOpen,
  sidebarWidth,
  ...props
}: {
  isLoading: boolean
  isPlanted: boolean
  sidebarOpen: boolean
  sidebarWidth: number
} & React.ComponentProps<typeof DynamicFlowerScene>) {
  return (
    <>
      {isLoading && (
        <div
          className="absolute top-0 bottom-0 left-0 flex items-center justify-center bg-gradient-to-b from-purple-200 to-purple-300"
          style={{
            right: isPlanted ? 0 : sidebarOpen ? `${sidebarWidth}px` : 0,
          }}
        >
          <p className="text-lg font-medium">Loading 3D scene...</p>
        </div>
      )}
      {!isLoading && <DynamicFlowerScene {...props} />}
    </>
  )
}

// Sidebar width constants
const SIDEBAR_WIDTH_MOBILE = 320
const SIDEBAR_WIDTH_DESKTOP = 384

// Define a consistent transition for both sidebar and scene container
const TRANSITION_STYLE = "transition-all duration-300 ease-in-out"

export default function Home() {
  const { user, isAuthenticated, signOut } = useUser()
  const [petalCount, setPetalCount] = useState(8)
  const [petalLength, setPetalLength] = useState(1)
  const [petalWidth, setPetalWidth] = useState(0.5)
  const [stemHeight, setStemHeight] = useState(3)
  const [petalColor, setPetalColor] = useState("#ff6b6b")
  const [centerColor, setCenterColor] = useState("#feca57")
  const [stemColor, setStemColor] = useState("#1dd1a1")
  const [seed, setSeed] = useState(Math.random())
  const [isPlanted, setIsPlanted] = useState(false)
  const [plantedFlowers, setPlantedFlowers] = useState<PlantedFlower[]>([])
  const [isClient, setIsClient] = useState(false)
  const [focusedFlowerPosition, setFocusedFlowerPosition] = useState<[number, number, number] | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("shape")
  const [showUserFlowersSidebar, setShowUserFlowersSidebar] = useState(false)
  const [wateredFlowerId, setWateredFlowerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Let's simplify our approach and just modify the scene container to include the loading state

  // First, add a new state for tracking the loading state
  const [isSceneLoading, setIsSceneLoading] = useState(true)

  // Create refs for the scene container and sidebar
  const sceneContainerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Set isClient to true once component mounts and detect mobile
  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Add click handler to close sidebar when clicking outside on mobile
  useEffect(() => {
    // Change the event parameter type to be more generic
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Only handle this on mobile when the sidebar is open and we're in editor mode
      if (!isMobile || !sidebarOpen || isPlanted) return

      // Check if the click is outside the sidebar
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        sceneContainerRef.current &&
        sceneContainerRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside as EventListener)
    document.addEventListener("touchstart", handleClickOutside as EventListener)

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as EventListener)
      document.removeEventListener("touchstart", handleClickOutside as EventListener)
    }
  }, [isMobile, sidebarOpen, isPlanted])

  // Load planted flowers on mount and when authentication changes
  useEffect(() => {
    if (isClient) {
      loadFlowers()
      setPlantedFlowers(getPlantedFlowers())
    }
  }, [isClient])

  // Reset focused flower when switching to single flower view
  useEffect(() => {
    if (!isPlanted) {
      setFocusedFlowerPosition(null)
      setWateredFlowerId(null)
    }
  }, [isPlanted])

  useEffect(() => {
    if (isClient) {
      // Generate a random flower when the component mounts
      generateNewFlower()
      setIsLoading(false)
    }
  }, [isClient]) // Only run once when isClient becomes true

  const generateNewFlower = () => {
    // Randomize all flower parameters
    setPetalCount(Math.floor(Math.random() * 15) + 5) // 5-20 petals
    setPetalLength(0.5 + Math.random() * 1.5) // 0.5-2.0 length
    setPetalWidth(0.1 + Math.random() * 0.9) // 0.1-1.0 width
    setStemHeight(1 + Math.random() * 4) // 1-5 height

    // Generate random colors
    const randomColor = () => {
      const letters = "0123456789ABCDEF"
      let color = "#"
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color
    }

    setPetalColor(randomColor())
    setCenterColor(randomColor())
    setStemColor(randomColor())

    // Also change the seed for additional randomness in the geometry
    setSeed(Math.random())
  }

  const handlePlantFlower = () => {
    if (!user) return

    // Generate a random position within the field
    const x = Math.random() * 20 - 10 // -10 to 10
    const z = Math.random() * 20 - 10 // -10 to 10
    const position: [number, number, number] = [x, 0, z]

    // Plant the flower
    const newFlower = plantFlower({
      username: user.username,
      petalCount,
      petalLength,
      petalWidth,
      stemHeight,
      petalColor,
      centerColor,
      stemColor,
      seed,
      position,
    })

    // Update the local state - use a function to ensure we're working with the latest state
    setPlantedFlowers((prevFlowers) => {
      // Check if this flower is already in the array (by ID)
      const exists = prevFlowers.some((f) => f.id === newFlower.id)
      if (exists) return prevFlowers
      return [...prevFlowers, newFlower]
    })

    // Set the focused flower position
    setFocusedFlowerPosition(position)

    // Switch to planted view
    setIsPlanted(true)

    // Make sure the My Flowers sidebar is closed
    setShowUserFlowersSidebar(false)

    // Generate a new flower for next time
    generateNewFlower()
  }

  const toggleView = () => {
    setIsPlanted(!isPlanted)
    // Close the sidebar when switching views
    setShowUserFlowersSidebar(false)
    // Clear any watered flower focus
    setWateredFlowerId(null)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Handle watering a flower
  const handleWaterFlower = (flowerId: string) => {
    setWateredFlowerId(flowerId)
  }

  // Function to get initials from username
  const getUserInitial = (username: string) => {
    return username.charAt(0).toUpperCase()
  }

  // Function to generate a consistent color based on username - now using custom-primary
  const getUserColor = (username: string) => {
    return "#713A91" // Using color 4 (custom-primary) for user avatar
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-purple-200 to-purple-300 p-4">
        <SignInForm />
      </div>
    )
  }

  // Calculate the sidebar width based on screen size
  const sidebarWidth = isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH_DESKTOP

  return (
    <div className="fixed inset-0">
      {/* Canvas container with dynamic sizing */}
      {/* Then update the scene container to include the loading indicator
      // Find the scene container div and update it: */}
      <div
        ref={sceneContainerRef}
        className={`absolute ${isPlanted ? "inset-0" : "top-0 bottom-0 left-0"} ${!isPlanted ? TRANSITION_STYLE : ""}`}
        style={{
          right: isPlanted ? 0 : sidebarOpen ? `${sidebarWidth}px` : 0,
        }}
      >
        {isSceneLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-200 to-purple-300">
            <p className="text-lg font-medium">Loading 3D scene...</p>
          </div>
        )}
        {isClient && (
          <DynamicFlowerScene
            petalCount={petalCount}
            petalLength={petalLength}
            petalWidth={petalWidth}
            stemHeight={stemHeight}
            petalColor={petalColor}
            centerColor={centerColor}
            stemColor={stemColor}
            seed={seed}
            isPlanted={isPlanted}
            plantedFlowers={plantedFlowers}
            focusedFlowerPosition={focusedFlowerPosition}
            sidebarVisible={!isPlanted && sidebarOpen}
            wateredFlowerId={wateredFlowerId}
            onLoad={() => setIsSceneLoading(false)}
          />
        )}
      </div>

      {/* User Flowers Sidebar (only visible in garden view when requested) */}
      {isPlanted && showUserFlowersSidebar && (
        <UserFlowersSidebar
          onClose={() => setShowUserFlowersSidebar(false)}
          username={user?.username || ""}
          plantedFlowers={plantedFlowers}
          setPlantedFlowers={setPlantedFlowers}
          onWaterFlower={handleWaterFlower}
        />
      )}

      {/* View toggle button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={toggleView}
          className={`px-4 py-3 rounded-full shadow-md transition-colors flex items-center gap-2 ${
            isPlanted
              ? "bg-emerald-700 hover:bg-emerald-700/90 text-custom-text"
              : "bg-emerald-700 hover:bg-emerald-700/90 text-custom-text"
          }`}
          aria-label="Toggle view"
        >
          {isPlanted ? <Pencil className="h-5 w-5" /> : <Flower className="h-5 w-5" />}
          <span className="text-sm font-medium whitespace-nowrap">{isPlanted ? "Flower Editor" : "View Garden"}</span>
        </button>
      </div>

      {/* User avatar button in garden view */}
      {isPlanted && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowUserFlowersSidebar(true)}
            className="h-10 w-10 rounded-full bg-custom-primary text-custom-text shadow-md hover:bg-custom-primary/90 flex items-center justify-center"
            aria-label="Show my flowers"
          >
            {getUserInitial(user?.username || "")}
          </button>
        </div>
      )}

      {/* Sidebar toggle button (only visible on mobile and when not in planted view) */}
      {isMobile && !isPlanted && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleSidebar}
            className="p-3 bg-custom-secondary text-custom-text rounded-full shadow-md hover:bg-custom-secondary/90 transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
          </button>
        </div>
      )}

      {/* Floating action buttons (only in flower editor mode) - centered in the visible area */}
      {!isPlanted && (
        <div
          className={`absolute bottom-6 z-10 ${TRANSITION_STYLE}`}
          style={{
            left: `calc(50% - ${sidebarOpen ? sidebarWidth / 2 : 0}px)`,
            transform: "translateX(-50%)",
            width: "fit-content",
          }}
        >
          <div className="flex gap-4">
            <button
              onClick={generateNewFlower}
              className="bg-custom-secondary text-custom-text py-3 px-4 rounded-full shadow-md hover:bg-custom-secondary/90 transition-colors flex items-center gap-2"
              aria-label="Generate random flower"
            >
              <Shuffle className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">Random</span>
            </button>

            <button
              onClick={handlePlantFlower}
              className="bg-custom-primary hover:bg-custom-primary/90 text-custom-text py-3 px-4 rounded-full shadow-md transition-colors flex items-center gap-2"
              aria-label="Plant this flower in the garden"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">Plant Flower</span>
            </button>
          </div>
        </div>
      )}

      {/* Fixed control panel on the right side */}
      {!isPlanted && (
        <div
          ref={sidebarRef}
          className={`absolute top-0 right-0 h-full bg-custom-dark text-custom-text backdrop-blur-sm shadow-lg border-l border-custom-secondary/30 overflow-y-auto z-10 ${TRANSITION_STYLE} ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ width: sidebarWidth }}
        >
          <div className="h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-custom-text">Flower Garden</CardTitle>
              <CardDescription className="text-custom-text/70 text-pretty opacity-80">
                Create a flower and plant it in your garden
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-grow overflow-y-auto">
              {isMobile ? (
                // Mobile view with tabs
                <Tabs defaultValue="shape" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-custom-input">
                    <TabsTrigger
                      value="shape"
                      className="data-[state=active]:bg-custom-primary data-[state=active]:text-custom-text text-custom-text/70"
                    >
                      Shape
                    </TabsTrigger>
                    <TabsTrigger
                      value="colors"
                      className="data-[state=active]:bg-custom-primary data-[state=active]:text-custom-text text-custom-text/70"
                    >
                      Colors
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="shape" className="mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Petal Count: {petalCount}</label>
                        <Slider
                          min={3}
                          max={20}
                          step={1}
                          value={[petalCount]}
                          onValueChange={(value) => setPetalCount(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">
                          Petal Length: {petalLength.toFixed(1)}
                        </label>
                        <Slider
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={[petalLength]}
                          onValueChange={(value) => setPetalLength(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">
                          Petal Width: {petalWidth.toFixed(1)}
                        </label>
                        <Slider
                          min={0.1}
                          max={1}
                          step={0.1}
                          value={[petalWidth]}
                          onValueChange={(value) => setPetalWidth(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">
                          Stem Height: {stemHeight.toFixed(1)}
                        </label>
                        <Slider
                          min={1}
                          max={5}
                          step={0.1}
                          value={[stemHeight]}
                          onValueChange={(value) => setStemHeight(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="colors" className="mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Petal Color</label>
                        <ColorPicker color={petalColor} onChange={setPetalColor} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Center Color</label>
                        <ColorPicker color={centerColor} onChange={setCenterColor} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Stem Color</label>
                        <ColorPicker color={stemColor} onChange={setStemColor} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                // Desktop view with both sections in a single view
                <div className="space-y-6">
                  {/* Shape Section */}
                  <div>
                    <h3 className="text-lg font-medium text-custom-text mb-4">Shape</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Petal Count: {petalCount}</label>
                        <Slider
                          min={3}
                          max={20}
                          step={1}
                          value={[petalCount]}
                          onValueChange={(value) => setPetalCount(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">
                          Petal Length: {petalLength.toFixed(1)}
                        </label>
                        <Slider
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={[petalLength]}
                          onValueChange={(value) => setPetalLength(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">
                          Petal Width: {petalWidth.toFixed(1)}
                        </label>
                        <Slider
                          min={0.1}
                          max={1}
                          step={0.1}
                          value={[petalWidth]}
                          onValueChange={(value) => setPetalWidth(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">
                          Stem Height: {stemHeight.toFixed(1)}
                        </label>
                        <Slider
                          min={1}
                          max={5}
                          step={0.1}
                          value={[stemHeight]}
                          onValueChange={(value) => setStemHeight(value[0])}
                          className="[&>[role=slider]]:bg-custom-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-custom-secondary/30 my-4"></div>

                  {/* Colors Section */}
                  <div>
                    <h3 className="text-lg font-medium text-custom-text mb-4">Colors</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Petal Color</label>
                        <ColorPicker color={petalColor} onChange={setPetalColor} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Center Color</label>
                        <ColorPicker color={centerColor} onChange={setCenterColor} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-custom-text">Stem Color</label>
                        <ColorPicker color={stemColor} onChange={setStemColor} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* User info section */}
            <div className="p-4 border-t border-custom-secondary/30">
              {user && (
                <div className="relative group">
                <div className="flex items-center gap-3 p-3 bg-custom-input rounded-md">                    
                  <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-custom-text font-medium text-lg flex-shrink-0 cursor-pointer"
                      style={{ backgroundColor: getUserColor(user.username) }}
                    >
                      {getUserInitial(user.username)}
                    </div>                    
                    <div className="flex-grow min-w-0">
                      <div className="text-sm font-medium truncate text-custom-text">{user.username}</div>
                      <div className="text-xs text-custom-text/70">
                        {plantedFlowers.filter((f) => f.username === user.username).length} flowers planted
                      </div>
                    </div>
                    <button
                      onClick={signOut}
                      className="p-2 rounded-md hover:bg-custom-secondary/30 transition-colors text-custom-text/70"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Dropdown menu */}
                  <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                    <div className="bg-custom-dark border border-custom-secondary/30 rounded-md shadow-lg p-2">
                      <button
                        onClick={() => {
                          setIsPlanted(true)
                          setShowUserFlowersSidebar(true)
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-custom-secondary/20 text-custom-text flex items-center gap-2"
                      >
                        <Flower className="h-4 w-4" />
                        <span>My Flowers</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
