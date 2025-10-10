import { useState } from "react";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * AIAssistant - Context-aware floating chat widget
 * Provides intelligent guidance based on current map view and user actions
 * TODO: Connect to backend AI endpoint for real responses
 */
const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your EcoNav AI assistant. Ask me about routes, parking, or your eco-impact! 🌱",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);

    // Simulated AI response (replace with real API call to /api/ai/chat)
    setTimeout(() => {
      const responses = [
        "Based on current traffic, the eco-route to the library saves 0.8 kg CO₂ compared to the direct route.",
        "Parking Lot B has 12 available spots. I can reserve one for you!",
        "Your eco-score increased by 45 points today! Keep up the green commuting! 🎉",
        "The safest route to your destination uses well-lit paths with 95% CCTV coverage.",
      ];
      const aiMessage = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 800);

    setInput("");
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-2xl bg-gradient-eco hover:scale-110 hover:shadow-glow transition-all duration-300 animate-pulse-glow"
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>
    );
  }

  return (
    <Card className="w-80 sm:w-96 h-[400px] sm:h-[500px] flex flex-col bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl animate-fade-in hover:shadow-glow transition-all duration-300 relative z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-eco rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">EcoNav AI</h3>
            <p className="text-xs text-white/80">Your smart campus guide</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 rounded-lg"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] p-3 sm:p-4 rounded-2xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-eco text-white"
                    : "bg-muted/50 text-foreground border border-border/20"
                }`}
              >
                <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 sm:p-6 border-t border-border/50 bg-muted/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 rounded-xl border-border/50 focus:border-primary"
          />
          <Button 
            onClick={handleSend} 
            size="icon"
            className="rounded-xl bg-gradient-eco hover:shadow-glow transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Powered by context-aware AI
        </p>
      </div>
    </Card>
  );
};

export default AIAssistant;
