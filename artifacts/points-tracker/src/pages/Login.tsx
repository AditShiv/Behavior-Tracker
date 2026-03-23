import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowRight } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/gaming-bg.png`} 
          alt="Gaming Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-6 sm:p-10 text-center"
      >
        <div className="mx-auto w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon-strong animate-pulse duration-3000">
          <Gamepad2 className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold mb-4 text-gradient">
          Robux Tracker
        </h1>
        
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          Level up your behavior, earn points, and redeem them for Robux. Welcome to the ultimate family game.
        </p>

        <Button 
          onClick={onLogin}
          size="lg"
          className="w-full h-14 text-lg font-bold rounded-2xl bg-white text-black hover:bg-white/90 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 group"
        >
          <span>Enter the Game</span>
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
}
