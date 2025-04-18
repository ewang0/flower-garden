"use client"

import { useState, useEffect } from "react"
import { Droplet, Trash2, MoreVertical, X } from "lucide-react"
import { waterFlower, removeFlower, type PlantedFlower } from "@/lib/flower-storage"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "@/lib/date-utils"

interface UserFlowersSidebarProps {
  username: string
  onClose: () => void
  plantedFlowers: PlantedFlower[]
  setPlantedFlowers: (flowers: PlantedFlower[]) => void
  onWaterFlower?: (flowerId: string) => void
}

export function UserFlowersSidebar({
  username,
  onClose,
  plantedFlowers,
  setPlantedFlowers,
  onWaterFlower,
}: UserFlowersSidebarProps) {
  const [userFlowers, setUserFlowers] = useState<PlantedFlower[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [justWateredId, setJustWateredId] = useState<string | null>(null)

  // Filter flowers to only show the user's flowers
  useEffect(() => {
    // Create a Map to track unique flower IDs
    const uniqueFlowers = new Map<string, PlantedFlower>()

    // Filter flowers by username and ensure uniqueness by ID
    plantedFlowers.forEach((flower) => {
      if (flower.username === username) {
        uniqueFlowers.set(flower.id, flower)
      }
    })

    // Convert Map values back to array
    setUserFlowers(Array.from(uniqueFlowers.values()))
  }, [plantedFlowers, username])

  // Handle watering a flower
  const handleWaterFlower = (flowerId: string) => {
    const updatedFlower = waterFlower(flowerId)
    if (updatedFlower) {
      // Set the flower as just watered for animation
      setJustWateredId(flowerId)
      setTimeout(() => setJustWateredId(null), 2000)

      // Update both the filtered list and the main list
      setUserFlowers((prev) => prev.map((f) => (f.id === flowerId ? updatedFlower : f)))
      setPlantedFlowers(plantedFlowers.map((f) => (f.id === flowerId ? updatedFlower : f)))

      // Notify parent component about the watered flower
      if (onWaterFlower) {
        onWaterFlower(flowerId)
        // Close the sidebar after watering to show the full view of the watered flower
        setIsCollapsed(true)
      }
    }
  }

  // Handle removing a flower
  const handleRemoveFlower = (flowerId: string) => {
    const success = removeFlower(flowerId)
    if (success) {
      // Update both the filtered list and the main list
      setUserFlowers((prev) => prev.filter((f) => f.id !== flowerId))
      setPlantedFlowers(plantedFlowers.filter((f) => f.id !== flowerId))
    }
  }

  // Function to get initials from username
  const getUserInitial = (username: string) => {
    return username.charAt(0).toUpperCase()
  }

  // Function to generate a consistent color based on username
  const getUserColor = (username: string) => {
    return "#713A91" // Using custom-primary color
  }

  // Render collapsed sidebar - just the avatar button
  if (isCollapsed) {
    return (
      <div className="absolute top-4 right-4 z-20">
        <button
          className="h-11 w-11 rounded-full bg-custom-primary text-custom-text shadow-md hover:bg-custom-primary/90"
          onClick={() => setIsCollapsed(false)}
        >
          {getUserInitial(username)}
        </button>
      </div>
    )
  }

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-custom-dark text-custom-text backdrop-blur-sm shadow-lg border-l border-custom-secondary/30 z-20 overflow-hidden flex flex-col">
      {/* Header - only collapse button, no X button */}
      <div className="p-4 border-b border-custom-secondary/30 flex items-center justify-between">
        <h2 className="font-medium">My Flowers ({userFlowers.length})</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8 rounded-full hover:bg-custom-secondary/20"
          title="Collapse sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Flower List */}
      <div className="flex-1 overflow-y-auto">
        {userFlowers.length === 0 ? (
          <div className="p-4 text-center text-custom-text/70">You haven't planted any flowers yet</div>
        ) : (
          <div className="divide-y divide-custom-secondary/20">
            {userFlowers.map((flower) => (
              <div key={flower.id} className="p-4 hover:bg-custom-secondary/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${
                      justWateredId === flower.id ? "scale-110 animate-pulse" : ""
                    }`}
                    style={{
                      background: `radial-gradient(circle, ${flower.centerColor} 30%, ${flower.petalColor} 70%)`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Flower #{flower.id.slice(-4)}</div>
                    <div className="text-xs text-custom-text/70">
                      Planted {formatDistanceToNow(flower.plantedAt)} ago
                    </div>
                    {flower.lastWatered && (
                      <div className="text-xs text-custom-text/70">
                        Watered {formatDistanceToNow(flower.lastWatered)} ago
                      </div>
                    )}
                  </div>

                  {/* Ellipsis dropdown menu */}
                  <div className="relative group">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-custom-secondary/20">
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {/* Hover menu that appears on hover */}
                    <div className="absolute right-0 top-0 mt-8 w-36 bg-custom-dark border border-custom-secondary/30 rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-custom-secondary/20 text-left"
                        onClick={() => handleWaterFlower(flower.id)}
                      >
                        <Droplet className="h-4 w-4" />
                        <span>Water flower</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-custom-secondary/20 text-left text-red-400"
                        onClick={() => handleRemoveFlower(flower.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

