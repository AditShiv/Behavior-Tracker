import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gamepad2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (isSignup && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || "Authentication failed";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success(isSignup ? "Account created!" : "Login successful!");
      setUsername("");
      setPassword("");
      setError(null);
      onLogin();
    } catch (err) {
      const errorMsg = "Network error, try again";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

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
        
        <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
          {isSignup ? "Create an account to get started" : "Level up your behavior, earn points, and redeem them for Robux."}
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="h-12 bg-background/50 border-white/10 focus:border-primary text-lg"
          />
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="h-12 bg-background/50 border-white/10 focus:border-primary text-lg"
          />

          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-white text-black hover:bg-white/90 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSignup ? "Create Account" : "Enter the Game"}</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            disabled={isLoading}
            className="text-primary hover:underline font-semibold"
          >
            {isSignup ? "Login" : "Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
