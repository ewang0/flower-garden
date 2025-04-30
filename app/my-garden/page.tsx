"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import {
  getUserFlowers,
  waterFlower,
  removeFlower,
  type PlantedFlower,
} from "@/lib/flower-storage";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Trash2, ArrowLeft, Flower } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/date-utils";
import { type SetStateAction, type Dispatch } from "react";

export default function MyGarden() {
  const { user, isAuthenticated } = useUser();
  const router = useRouter();
  const [userFlowers, setUserFlowers] = useState<PlantedFlower[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, router, isLoading]);

  // Load user's flowers
  useEffect(() => {
    const fetchUserFlowers = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const flowers = await getUserFlowers(user.username);
          setUserFlowers(flowers);
        } catch (error) {
          console.error("Failed to fetch user flowers:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchUserFlowers();
  }, [user]);

  // Handle watering a flower
  const handleWaterFlower = async (flowerId: string) => {
    const updatedFlower = await waterFlower(flowerId);
    if (updatedFlower) {
      setUserFlowers((prevFlowers: PlantedFlower[]) =>
        prevFlowers.map((flower: PlantedFlower) =>
          flower.id === flowerId ? updatedFlower : flower
        )
      );
    } else {
      console.error("Failed to water flower in My Garden:", flowerId);
    }
  };

  // Handle removing a flower
  const handleRemoveFlower = async (flowerId: string) => {
    const success = await removeFlower(flowerId);
    if (success) {
      setUserFlowers((prevFlowers: PlantedFlower[]) =>
        prevFlowers.filter((flower: PlantedFlower) => flower.id !== flowerId)
      );
    } else {
      console.error("Failed to remove flower in My Garden:", flowerId);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-custom-dark">
        <p className="text-custom-text">Loading your garden...</p>
      </div>
    );
  }

  if (!user) {
    return null; // This will redirect due to the useEffect above
  }

  return (
    <div className="min-h-screen bg-custom-dark text-custom-text">
      <header className="p-4 border-b border-custom-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-2 rounded-full bg-custom-secondary/20 hover:bg-custom-secondary/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">My Garden</h1>
        </div>
        <div className="text-sm text-custom-text/70">
          {userFlowers.length} {userFlowers.length === 1 ? "flower" : "flowers"}{" "}
          planted
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {userFlowers.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-custom-secondary/20 mb-4">
              <Flower className="h-8 w-8 text-custom-primary" />
            </div>
            <h2 className="text-xl font-medium mb-2">No flowers planted yet</h2>
            <p className="text-custom-text/70 mb-6">
              Head back to the garden to plant your first flower!
            </p>
            <Link href="/">
              <Button className="bg-custom-primary hover:bg-custom-primary/90 text-custom-text">
                Go to Garden
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFlowers.map((flower) => (
              <Card
                key={flower.id}
                className="bg-custom-input border-custom-secondary/30"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: flower.petalColor }}
                    />
                    <span>Flower #{flower.id.slice(-4)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-custom-dark/50 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                    <div
                      className="w-16 h-16 transform scale-150"
                      style={{
                        background: `radial-gradient(circle, ${flower.centerColor} 30%, ${flower.petalColor} 70%)`,
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-custom-text/70">Planted:</span>
                      <span>
                        {formatDistanceToNow(
                          new Date(flower.plantedAt).getTime()
                        )}{" "}
                        ago
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-custom-text/70">Last watered:</span>
                      <span>
                        {flower.lastWatered
                          ? formatDistanceToNow(
                              new Date(flower.lastWatered).getTime()
                            ) + " ago"
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-custom-text/70">
                        Times watered:
                      </span>
                      <span>{flower.waterCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-0">
                  <Button
                    variant="outline"
                    className="flex-1 border-custom-secondary/30 hover:bg-custom-secondary/20 text-custom-text"
                    onClick={() => handleWaterFlower(flower.id)}
                  >
                    <Droplet className="h-4 w-4 mr-2 text-blue-400" />
                    Water
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-custom-secondary/30 hover:bg-custom-secondary/20 text-custom-text"
                    onClick={() => handleRemoveFlower(flower.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
