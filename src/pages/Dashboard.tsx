import { useState } from "react";
import { Leaf, MapPin, Route, Users, Settings, Activity } from "lucide-react";
import MapView from "@/components/map/MapView";
import LayerControls from "@/components/map/LayerControls";
import AIAssistant from "@/components/ai/AIAssistant";
import StatsPanel from "@/components/dashboard/StatsPanel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MapComponent from "@/components/MapComponent";


/**
 * Dashboard - Main map-centric view with layer controls
 * Shows NDVI heatmap, carbon emissions, parking status, and safe paths
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [activeLayers, setActiveLayers] = useState({
    ndvi: true,
    carbon: false,
    parking: true,
    safePath: false,
  });

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-background via-muted/10 to-eco-green/5">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-eco flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">EcoNav 360</h1>
              <p className="text-xs text-muted-foreground">Campus Green Intelligence</p>
            </div>
            
          </div>
          
          <div className="flex items-center gap-2 ">
            <Button variant="ghost" size="sm" onClick={() =>{ 
              
            navigate("/route-planner")

            }}>
              <Route className="w-4 h-4 mr-2 " />
              Plan Route
            </Button>
            <Button variant="ghost" size="sm" onClick={() =>{ 
              
            navigate("/route-planner")

           navigate("/parking")}}>
              <MapPin className="w-4 h-4 mr-2" />
              Parking
            </Button>
            <Button variant="ghost" size="sm" onClick={() =>{ 
              
            navigate("/route-planner")

             navigate("/leaderboard")}}>
              <Users className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() =>{ 
             
            navigate("/route-planner")

            navigate("/admin")}}>
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Map and Right Panel Side by Side */}
      <div className="absolute top-16 left-0 right-0 bottom-0 flex gap-4 p-4">
        {/* Map Container - 60% width */}
        <div className="w-3/5 h-full relative">
          <div className="map-wrapper absolute inset-0 rounded-2xl overflow-hidden shadow-2xl">
            <MapComponent center={[28.6139, 77.2090]} zoom={13} />
          </div>
        </div>

        {/* Right Panel - 40% width with side-by-side layout */}
        <div className="w-2/5 h-full flex flex-col gap-3">
          {/* Top Row - Layer Controls and Campus Impact side by side */}
          <div className="flex gap-3 h-2/3">
            {/* Layer Controls Panel - Left side */}
            <div className="w-1/2 animate-slide-in">
              <LayerControls activeLayers={activeLayers} onToggleLayer={toggleLayer} />
            </div>
            
            {/* Campus Impact Panel - Right side */}
            <div className="w-1/2 animate-fade-in">
              <StatsPanel />
            </div>
          </div>
          
          {/* Bottom Row - Live Campus Status (smaller, compact) */}
          <div className="h-1/3">
            <div className="bg-card/95 backdrop-blur-xl rounded-xl p-3 border border-border/50 shadow-2xl animate-fade-in hover:shadow-glow transition-all duration-300 h-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-eco flex items-center justify-center">
                  <Activity className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold text-foreground text-xs sm:text-sm">Live Campus Status</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 rounded-lg bg-eco-green/5">
                  <div className="text-eco-green font-bold text-sm">Good (85)</div>
                  <div className="text-muted-foreground text-xs">Air Quality</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-eco-teal/5">
                  <div className="text-eco-teal font-bold text-sm">67%</div>
                  <div className="text-muted-foreground text-xs">Parking</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-primary/5">
                  <div className="text-primary font-bold text-sm">High</div>
                  <div className="text-muted-foreground text-xs">Green Index</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant - Bottom Right with higher z-index */}
      <div className="absolute right-4 bottom-4 z-50">
        <AIAssistant />
      </div>
    </div>
  );
};

export default Dashboard;
