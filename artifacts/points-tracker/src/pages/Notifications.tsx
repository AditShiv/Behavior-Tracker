import { motion } from "framer-motion";
import { format } from "date-fns";
import { Bell, CheckCircle2 } from "lucide-react";
import { useListNotifications, useMarkNotificationRead } from "@/hooks/use-notifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Notifications() {
  const { data } = useListNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  const notifications = data?.notifications.slice().reverse() || [];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/20 rounded-xl">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Alerts & Messages</h1>
          <p className="text-muted-foreground">Updates on your redemption requests.</p>
        </div>
      </div>

      <Card className="glass-panel overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((n, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={n.id} 
                className={`p-6 flex items-start gap-4 transition-colors ${n.read ? 'bg-transparent' : 'bg-primary/5'}`}
              >
                <div className="mt-1">
                  {n.read ? (
                    <div className="w-2 h-2 rounded-full bg-white/20 mt-2" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse mt-1.5 shadow-[0_0_8px_hsl(var(--primary))]" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`text-lg ${n.read ? 'text-foreground/80' : 'text-foreground font-semibold'}`}>
                    {n.message}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {format(new Date(n.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>

                {!n.read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => markRead({ id: n.id })}
                    className="text-muted-foreground hover:text-success hover:bg-success/10"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Mark Read
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
