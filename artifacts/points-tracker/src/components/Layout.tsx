import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Gamepad2, Bell, LogOut, ShieldAlert, LayoutDashboard, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListNotifications } from "@/hooks/use-notifications";
import { AuthUser } from "@workspace/replit-auth-web";

interface LayoutProps {
  children: ReactNode;
  user: AuthUser;
  isCousin: boolean;
  onLogout: () => void;
}

export function Layout({ children, user, isCousin, onLogout }: LayoutProps) {
  const [location] = useLocation();
  const { data: notificationsData } = useListNotifications();
  
  const unreadCount = notificationsData?.notifications.filter(n => !n.read).length || 0;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background layer */}
      <div className="fixed inset-0 z-[-1] bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl hidden sm:inline-block text-gradient">
              RobuxTracker
            </span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            {isCousin ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className={location === "/cousin" ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-foreground"}
                >
                  <Link href="/cousin">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className={location === "/cousin/notifications" ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-foreground"}
                >
                  <Link href="/cousin/notifications" className="relative">
                    <Bell className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Alerts</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 sm:top-1.5 sm:right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    )}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className={location === "/admin" ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-foreground"}
                >
                  <Link href="/admin">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Admin Hub</span>
                  </Link>
                </Button>
              </>
            )}

            <div className="h-6 w-px bg-white/10 mx-2" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="avatar" className="w-8 h-8 rounded-full border border-white/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-white/10">
                    <span className="text-xs font-bold text-muted-foreground">{user.firstName?.[0] || 'U'}</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <div className="container max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
