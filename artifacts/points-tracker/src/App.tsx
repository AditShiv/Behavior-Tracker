import { useEffect, useState } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

import { useGetCousinId } from "@/hooks/use-admin";

import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Setup } from "@/pages/Setup";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { CousinDashboard } from "@/pages/CousinDashboard";
import { Notifications } from "@/pages/Notifications";
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
  
  const { data: cousinData, isLoading: cousinLoading, refetch: refetchCousin } = useGetCousinId();

  if (authLoading || (user && cousinLoading)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  const cousinId = cousinData?.cousinId ?? null;
  const adminId = cousinData?.adminId ?? null;

  const isCousin = cousinId !== null && user.id === cousinId;
  const isAdmin = adminId !== null && user.id === adminId;

  if (!adminId || (!isCousin && !isAdmin)) {
    return <Setup userId={user.id} adminId={adminId} onComplete={() => refetchCousin()} />;
  }

  return (
    <Layout user={user} isCousin={isCousin} onLogout={logout}>
      <Switch>
        <Route path="/" component={() => <Redirect to={isCousin ? "/cousin" : "/admin"} />} />
        
        <Route path="/admin" component={isCousin ? () => <Redirect to="/cousin" /> : AdminDashboard} />
        
        <Route path="/cousin" component={isCousin ? CousinDashboard : () => <Redirect to="/admin" />} />
        <Route path="/cousin/notifications" component={isCousin ? Notifications : () => <Redirect to="/admin" />} />
        
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
