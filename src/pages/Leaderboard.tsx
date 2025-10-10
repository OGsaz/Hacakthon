import { ArrowLeft, Trophy, TrendingUp, Award, Medal, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Leaderboard - Gamified eco-score rankings
 * Shows individual users and departments with badges and achievements
 */
const Leaderboard = () => {
  const navigate = useNavigate();

  const users = [
    { rank: 1, name: "Priya Sharma", dept: "CS", score: 4850, co2: "52.3 kg", badge: "🌟" },
    { rank: 2, name: "Rahul Kumar", dept: "EE", score: 4620, co2: "48.7 kg", badge: "🏆" },
    { rank: 3, name: "Aisha Patel", dept: "ME", score: 4390, co2: "45.2 kg", badge: "🥇" },
    { rank: 4, name: "Arjun Singh", dept: "CE", score: 4150, co2: "42.8 kg", badge: "⭐" },
    { rank: 5, name: "Sneha Reddy", dept: "BT", score: 3920, co2: "39.5 kg", badge: "🌱" },
  ];

  const departments = [
    { rank: 1, name: "Computer Science", members: 450, avgScore: 3850, co2: "18.2 tons" },
    { rank: 2, name: "Electrical Eng.", members: 380, avgScore: 3720, co2: "16.8 tons" },
    { rank: 3, name: "Mechanical Eng.", members: 420, avgScore: 3590, co2: "15.4 tons" },
  ];

  const achievements = [
    { name: "Green Warrior", desc: "Saved 50kg CO₂", icon: "🌿", rarity: "rare" },
    { name: "Eco Pioneer", desc: "100 green routes", icon: "🚶", rarity: "epic" },
    { name: "Carbon Crusher", desc: "Top 1% saver", icon: "💚", rarity: "legendary" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-36 h-36 bg-eco-amber/5 rounded-full animate-float blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-28 h-28 bg-eco-green/5 rounded-full animate-float blur-2xl" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="hover:bg-eco-amber/10 hover:text-eco-amber transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-eco-amber bg-clip-text text-transparent">
              Eco-Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">Compete for sustainability supremacy</p>
          </div>
          <Button 
            variant="outline"
            className="hover:bg-eco-amber/10 hover:text-eco-amber hover:border-eco-amber transition-all duration-300 hover:scale-105"
          >
            <Award className="w-4 h-4 mr-2" />
            My Profile
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-eco data-[state=active]:text-white">Top Users</TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-gradient-eco data-[state=active]:text-white">Departments</TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-gradient-eco data-[state=active]:text-white">Achievements</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="p-4 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl hover:shadow-glow transition-all duration-300">
              <div className="space-y-3 sm:space-y-4">
                {users.map((user, index) => (
                  <div
                    key={user.rank}
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fade-in ${
                      user.rank <= 3 ? "bg-gradient-to-r from-eco-green/10 to-eco-teal/10 border border-eco-green/20" : "bg-muted/20 hover:bg-muted/30"
                    }`}
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-lg ${
                      user.rank === 1 ? 'bg-gradient-to-r from-eco-amber to-eco-orange text-white' :
                      user.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                      user.rank === 3 ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {user.rank}
                    </div>
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarFallback className="bg-gradient-eco text-white text-sm sm:text-base">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{user.name}</h3>
                        <span className="text-lg sm:text-2xl">{user.badge}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{user.dept} Department</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-2xl font-bold text-primary">{user.score}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">eco-points</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-lg font-semibold text-eco-green">{user.co2}</p>
                      <p className="text-xs text-muted-foreground">CO₂ saved</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div
                    key={dept.rank}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 hover:shadow-card transition-all"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 font-bold text-secondary text-lg">
                      {dept.rank}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{dept.name}</h3>
                      <p className="text-sm text-muted-foreground">{dept.members} members</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{dept.avgScore}</p>
                      <p className="text-xs text-muted-foreground">avg score</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-eco-green">{dept.co2}</p>
                      <p className="text-xs text-muted-foreground">CO₂ saved</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card
                  key={achievement.name}
                  className="p-6 text-center space-y-4 hover:shadow-glow transition-shadow"
                >
                  <div className="text-6xl">{achievement.icon}</div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.desc}</p>
                  </div>
                  <Badge
                    variant={
                      achievement.rarity === "legendary"
                        ? "default"
                        : achievement.rarity === "epic"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {achievement.rarity}
                  </Badge>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Your Stats */}
        <Card className="p-6 bg-gradient-eco text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Your Eco-Score</h3>
              <p className="text-white/80">Keep pushing for the top!</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">2,458</p>
              <p className="text-white/80">Rank #47</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">+145</p>
              <p className="text-sm text-white/80">This week</p>
            </div>
            <div className="text-center">
              <Zap className="w-6 h-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-white/80">Achievements</p>
            </div>
            <div className="text-center">
              <Medal className="w-6 h-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">38.4kg</p>
              <p className="text-sm text-white/80">CO₂ saved</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
