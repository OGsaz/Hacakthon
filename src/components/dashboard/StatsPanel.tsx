import { TrendingDown, Droplets, Wind, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/**
 * StatsPanel - Real-time campus sustainability metrics
 * Displays daily impact, environmental stats, and eco-score
 */
const StatsPanel = () => {
  const stats = [
    {
      label: "CO₂ Saved Today",
      value: "47.3 kg",
      icon: TrendingDown,
      color: "text-eco-green",
      progress: 68,
      progressColor: "bg-eco-green",
    },
    {
      label: "Water Conserved",
      value: "1,240 L",
      icon: Droplets,
      color: "text-eco-teal",
      progress: 82,
      progressColor: "bg-eco-teal",
    },
    {
      label: "Air Quality Index",
      value: "Good (85)",
      icon: Wind,
      color: "text-primary",
      progress: 85,
      progressColor: "bg-primary",
    },
    {
      label: "Your Eco-Score",
      value: "2,458 pts",
      icon: Award,
      color: "text-eco-amber",
      progress: 92,
      progressColor: "bg-eco-amber",
    },
  ];

  return (
    <Card className="w-64 sm:w-72 h-auto max-h-96 p-4 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl animate-fade-in overflow-hidden hover:shadow-glow transition-all duration-300 ">
      <div className="space-y-4">
        <div className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-energy flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-white " />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base ">Campus Impact</h3>
              <p className="text-xs text-muted-foreground">Live sustainability metrics</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-3 rounded-xl bg-gradient-to-r from-muted/10 to-muted/5 hover:from-muted/20 hover:to-muted/10 transition-all duration-300 hover:scale-105 border border-border/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${stat.color.replace('text-', 'bg-')}/10`}>
                      <Icon className={`w-3 h-3 ${stat.color}`} />
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <span className={`text-sm sm:text-base font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={stat.progress} 
                    className="h-2 bg-muted/20" 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{stat.progress}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default StatsPanel;
