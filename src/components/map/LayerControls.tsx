import { Layers, Leaf, Cloud, MapPin, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * LayerControls - Toggle environmental data layers on the map
 * Controls NDVI (green index), carbon emissions, parking, and safe paths
 */
interface LayerControlsProps {
  activeLayers: {
    ndvi: boolean;
    carbon: boolean;
    parking: boolean;
    safePath: boolean;
  };
  onToggleLayer: (layer: keyof LayerControlsProps["activeLayers"]) => void;
}

const LayerControls = ({ activeLayers, onToggleLayer }: LayerControlsProps) => {
  const layers = [
    {
      id: "ndvi" as const,
      name: "NDVI Green Index",
      icon: Leaf,
      color: "text-eco-green",
      description: "Vegetation health map",
    },
    {
      id: "carbon" as const,
      name: "Carbon Emissions",
      icon: Cloud,
      color: "text-eco-orange",
      description: "CO₂ hotspots",
    },
    {
      id: "parking" as const,
      name: "Parking Status",
      icon: MapPin,
      color: "text-eco-teal",
      description: "Live availability",
    },
    {
      id: "safePath" as const,
      name: "Safe Paths",
      icon: Shield,
      color: "text-secondary",
      description: "Well-lit routes",
    },
  ];

  return (
    <Card className="w-64 sm:w-72 h-auto max-h-96 p-4 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl animate-slide-in overflow-hidden hover:shadow-glow transition-all duration-300">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-eco flex items-center justify-center">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm sm:text-base">Map Layers</h3>
          <p className="text-xs text-muted-foreground">Toggle data overlays</p>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                activeLayers[layer.id] 
                  ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20' 
                  : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeLayers[layer.id] ? 'bg-primary/20' : 'bg-muted/20'
                }`}>
                  <Icon className={`w-4 h-4 ${layer.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={layer.id}
                    className="text-sm font-semibold text-foreground cursor-pointer block truncate"
                  >
                    {layer.name}
                  </Label>
                  <p className="text-xs text-muted-foreground truncate">{layer.description}</p>
                </div>
              </div>
              <Switch
                id={layer.id}
                checked={activeLayers[layer.id]}
                onCheckedChange={() => onToggleLayer(layer.id)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default LayerControls;
