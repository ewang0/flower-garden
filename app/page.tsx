"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ColorPicker } from "@/components/color-picker"
import { SignInForm } from "@/components/sign-in-form"
import { useUser } from "@/contexts/user-context"
import { getPlantedFlowers, plantFlower, loadFlowers, type PlantedFlower } from "@/lib/flower-storage"
import { Shuffle, PlusCircle, LogOut, Flower, ChevronRight, ChevronLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"

// Dynamically import the FlowerScene component with no SSR
const DynamicFlowerScene = dynamic(
  () => import("@/components/flower-scene").then((mod) => ({ default: mod.FlowerScene })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-purple-200 to-purple-300">
        <p className="text-lg font-medium">Loading 3D scene...</p>
      </div>
    ),
  },
)

// Sidebar width constants
const SIDEBAR_WIDTH_MOBILE = 320
const SIDEBAR_WIDTH_DESKTOP = 384

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
    }
  }, [isPlanted])

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

    // Update the local state
    setPlantedFlowers([...plantedFlowers, newFlower])

    // Set the focused flower position
    setFocusedFlowerPosition(position)

    // Switch to planted view
    setIsPlanted(true)

    // Generate a new flower for next time
    generateNewFlower()
  }

  const toggleView = () => {
    setIsPlanted(!isPlanted)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
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
      <div
        className={`absolute ${isPlanted ? "inset-0" : "top-0 bottom-0 left-0"}`}
        style={{
          right: isPlanted ? 0 : sidebarOpen ? `${sidebarWidth}px` : 0,
        }}
      >
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
          />
        )}
      </div>

      {/* View toggle button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={toggleView}
          className={`px-4 py-2 rounded-full shadow-md transition-colors flex items-center gap-2 ${
            isPlanted
              ? "bg-custom-primary hover:bg-custom-primary/90 text-custom-text"
              : "bg-custom-primary hover:bg-custom-primary/90 text-custom-text"
          }`}
          aria-label="Toggle view"
        >
          <Flower className="h-5 w-5" />
          <span className="text-sm font-medium whitespace-nowrap">
            {isPlanted ? "Community Garden" : "Flower Editor"}
          </span>
        </button>
      </div>

      {/* Sidebar toggle button (only visible on mobile and when not in planted view) */}
      {isMobile && !isPlanted && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleSidebar}
            className="p-2 bg-custom-secondary text-custom-text rounded-full shadow-md hover:bg-custom-secondary/90 transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      )}

      {/* Floating action buttons (only in flower editor mode) - centered in the visible area */}
      {!isPlanted && (
        <div
          className="absolute bottom-6 z-10"
          style={{
            left: `calc(50% - ${sidebarOpen ? sidebarWidth / 2 : 0}px)`,
            transform: "translateX(-50%)",
            width: "fit-content",
          }}
        >
          <div className="flex gap-4">
            <button
              onClick={generateNewFlower}
              className="bg-custom-secondary text-custom-text p-3 rounded-full shadow-md hover:bg-custom-secondary/90 transition-colors flex items-center gap-2"
              aria-label="Generate random flower"
            >
              <Shuffle className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">Random</span>
            </button>

            <button
              onClick={handlePlantFlower}
              className="bg-custom-primary hover:bg-custom-primary/90 text-custom-text p-3 px-4 rounded-full shadow-md transition-colors flex items-center gap-2"
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
          className={`absolute top-0 right-0 h-full bg-custom-dark text-custom-text backdrop-blur-sm shadow-lg border-l border-custom-secondary/30 overflow-y-auto z-10 transition-all duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ width: sidebarWidth }}
        >
          <div className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-custom-text">Flower Generator</CardTitle>
              <CardDescription className="text-custom-text/70">Customize your 3D flower</CardDescription>
            </CardHeader>

            <CardContent className="flex-grow overflow-y-auto">
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
            </CardContent>

            {/* User info section */}
            <div className="p-4 border-t border-custom-secondary/30">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-custom-input rounded-md">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-custom-text font-medium text-lg flex-shrink-0"
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

