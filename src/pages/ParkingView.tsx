import { useState, useEffect } from "react";
import { ArrowLeft, Camera, MapPin, Clock, Car, Download, Play, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import ParkingVideoModal from "@/components/ParkingVideoModal";

/**
 * ParkingView - Real-time parking availability dashboard
 * Shows camera-based detection, occupancy rates, and reservation system
 */
const ParkingView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [parkingLots, setParkingLots] = useState([]);
  const [stats, setStats] = useState({
    totalSpots: 230,
    availableNow: 70,
    occupancyRate: 70,
    activeCameras: 18
  });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Fetch parking data
  const fetchParkingData = async () => {
    try {
      const [lotsRes, statsRes] = await Promise.all([
        fetch('/api/parking/lots'),
        fetch('/api/parking/stats')
      ]);
      
      if (lotsRes.ok && statsRes.ok) {
        const lots = await lotsRes.json();
        const statsData = await statsRes.json();
        setParkingLots(lots);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch parking data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingData();
    const interval = setInterval(fetchParkingData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const calculateAvailability = (total: number, occupied: number) => {
    return Math.round(((total - occupied) / total) * 100);
  };

  // Button handlers
  const handleReserveSpot = async (lotId: string) => {
    try {
      const response = await fetch('/api/parking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotId, spotId: Math.floor(Math.random() * 10) + 1 })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Spot Reserved!",
          description: `Reservation ID: ${data.reservationId}`,
        });
      }
    } catch (error) {
      toast({
        title: "Reservation Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleNavigate = (lotId: string) => {
    toast({
      title: "Navigation Started",
      description: `Navigating to Lot ${lotId}`,
    });
  };

  const handleViewCameras = () => {
    setShowVideoModal(true);
    toast({
      title: "Camera View",
      description: "Opening live parking lot feed...",
    });
  };

  const handleSimulate = async (scenario: string) => {
    setSimulating(true);
    try {
      const response = await fetch('/api/parking/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Simulation Started",
          description: data.message,
        });
        // Refresh data after simulation
        setTimeout(() => {
          fetchParkingData();
          setSimulating(false);
        }, 2000);
      }
    } catch (error) {
      setSimulating(false);
      toast({
        title: "Simulation Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/parking/export');
      if (response.ok) {
        const data = await response.json();
        // Create and download report
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parking-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Report Exported",
          description: "Parking report downloaded successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-eco-teal/5 rounded-full animate-float blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-eco-green/5 rounded-full animate-float blur-2xl" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="hover:bg-eco-teal/10 hover:text-eco-teal transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-eco-teal bg-clip-text text-transparent">
              Smart Parking
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">AI-powered real-time parking detection</p>
          </div>
          <Button 
            onClick={handleViewCameras}
            className="bg-gradient-eco hover:shadow-glow transition-all duration-300 hover:scale-105"
          >
            <Camera className="w-4 h-4 mr-2" />
            View Cameras
          </Button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Spots", value: stats.totalSpots.toString(), icon: MapPin, color: "primary" },
            { label: "Available Now", value: stats.availableNow.toString(), icon: Car, color: "eco-green" },
            { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: Clock, color: "eco-amber" },
            { label: "Active Cameras", value: stats.activeCameras.toString(), icon: Camera, color: "eco-teal" },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.label} 
                className="p-3 sm:p-4 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className={`text-lg sm:text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Parking Lots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Loading parking data...</p>
            </div>
          ) : (
            parkingLots.map((lot) => {
            const availability = calculateAvailability(lot.total, lot.occupied);
            const available = lot.total - lot.occupied;

            return (
              <Card key={lot.id} className="p-6 space-y-4 hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground">Lot {lot.id}</h3>
                      <Badge
                        variant={availability > 50 ? "default" : availability > 20 ? "secondary" : "destructive"}
                      >
                        {availability}% available
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{lot.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{available}</p>
                    <p className="text-sm text-muted-foreground">spots free</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="text-foreground font-medium">
                      {lot.occupied}/{lot.total}
                    </span>
                  </div>
                  <Progress value={availability} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Camera className="w-4 h-4" />
                    <span>{lot.cameras} cameras active</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{lot.lastUpdate}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1" 
                    variant="default"
                    onClick={() => handleReserveSpot(lot.id)}
                  >
                    Reserve Spot
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleNavigate(lot.id)}
                  >
                    Navigate
                  </Button>
                </div>
              </Card>
            );
            })
          )}
        </div>

        {/* Simulation Controls */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Parking Simulation</h3>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleSimulate("rush-hour")}
              disabled={simulating}
            >
              <Play className="w-4 h-4 mr-2" />
              Simulate Rush Hour
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSimulate("event-traffic")}
              disabled={simulating}
            >
              <Play className="w-4 h-4 mr-2" />
              Simulate Event Traffic
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSimulate("normal")}
              disabled={simulating}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Normal
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleExportReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Use simulation controls to test parking system under different scenarios
          </p>
        </Card>
      </div>

      {/* Video Modal */}
      <ParkingVideoModal 
        isOpen={showVideoModal} 
        onClose={() => setShowVideoModal(false)} 
      />
    </div>
  );
};

export default ParkingView;
