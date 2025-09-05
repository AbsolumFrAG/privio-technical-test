import { Button } from "@/components/ui/button";
import { Clock, Search, TrendingUp } from "lucide-react";
import { useState } from "react";
import { GameSearch } from "./game-search";
import { PopularGames } from "./popular-games";
import { RecentGames } from "./recent-games";

type ActiveSection = "popular" | "recent" | "search";

interface DiscoveryPageProps {
  className?: string;
}

export function DiscoveryPage({ className }: DiscoveryPageProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("popular");

  const sections = [
    {
      key: "popular" as const,
      label: "Popular Games",
      icon: TrendingUp,
      description: "Discover the highest-rated and most-played games",
    },
    {
      key: "recent" as const,
      label: "Recently Added",
      icon: Clock,
      description: "See what games players have been adding lately",
    },
    {
      key: "search" as const,
      label: "Search Games",
      icon: Search,
      description: "Find specific games from the community",
    },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "popular":
        return <PopularGames />;
      case "recent":
        return <RecentGames />;
      case "search":
        return <GameSearch />;
      default:
        return <PopularGames />;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Games</h1>
        <p className="text-muted-foreground text-lg">
          Explore what the GameTracker community is playing
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.key}
                variant={activeSection === section.key ? "default" : "outline"}
                onClick={() => setActiveSection(section.key)}
                className="flex items-center gap-2 h-auto py-3 px-4"
              >
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">{section.label}</div>
                  <div className="text-xs opacity-80 hidden sm:block">
                    {section.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="min-h-[400px]">{renderActiveSection()}</div>
    </div>
  );
}
