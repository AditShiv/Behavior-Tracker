import { useEffect, useState } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

import { useGetPlayerId } from "@/hooks/use-admin";

import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Setup } from "@/pages/Setup";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { CousinDashboard } from "@/pages/CousinDashboard";
import { Notifications } from "@/pages/Notifications";
import { Chat } from "@/pages/Chat";
import NotFound from "@/pages/not-found";
import type { AuthUser } from "@workspace/replit-auth-web";

const queryClient = new QueryClient();

type User = AuthUser;

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground font-display tracking-widest uppercase text-sm">Loading...</p>
    </div>
  );
}

function useCustomAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        const data = await response.json();
        setUser(data.user || null);
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = () => {
    window.location.reload();
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    window.location.reload();
  };

  return { user, isLoading, login, logout };
}

function AppContent() {
  const { user, isLoading: authLoading, login, logout } = useCustomAuth();
  
  const { data: playerData, isLoading: playerLoading, refetch: refetchPlayer } = useGetPlayerId();

  if (authLoading || (user && playerLoading)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  const playerId = playerData?.playerId ?? null;
  const adminId = playerData?.adminId ?? null;

  const isPlayer = playerId !== null && user.id === playerId;
  const isAdmin = adminId !== null && user.id === adminId;

  if (!adminId || (!isPlayer && !isAdmin)) {
    return <Setup userId={user.id} adminId={adminId} onComplete={() => refetchPlayer()} />;
  }

  return (
    <Layout user={user} isPlayer={isPlayer} onLogout={logout}>
      <Switch>
        <Route path="/" component={() => <Redirect to={isPlayer ? "/player" : "/admin"} />} />
        
        <Route path="/admin" component={isPlayer ? () => <Redirect to="/player" /> : AdminDashboard} />
        <Route path="/admin/chat" component={isPlayer ? () => <Redirect to="/player" /> : () => <Chat user={user} />} />
        
        <Route path="/player" component={isPlayer ? CousinDashboard : () => <Redirect to="/admin" />} />
        <Route path="/player/notifications" component={isPlayer ? Notifications : () => <Redirect to="/admin" />} />
        <Route path="/player/chat" component={isPlayer ? () => <Chat user={user} /> : () => <Redirect to="/admin" />} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
