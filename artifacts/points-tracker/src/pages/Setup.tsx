import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSetCousinId } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Crown, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

const setupSchema = z.object({
  cousinId: z.string().min(3, "Please enter a valid User ID"),
});

interface SetupProps {
  userId: string;
  adminId: string | null;
  onComplete: () => void;
}

export function Setup({ userId, adminId, onComplete }: SetupProps) {
  const [claiming, setClaiming] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { mutate: setCousin, isPending: settingCousin } = useSetCousinId();

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: { cousinId: "" },
  });

  async function handleClaimAdmin() {
    setClaiming(true);
    try {
      const res = await fetch("/api/admin/claim", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        toast.error("Failed to claim admin", { description: data.error });
      } else {
        toast.success("You are now the admin!");
        setIsAdmin(true);
        onComplete();
      }
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setClaiming(false);
    }
  }

  function onSubmit(values: z.infer<typeof setupSchema>) {
    setCousin(
      { data: { cousinId: values.cousinId } },
      {
        onSuccess: () => {
          toast.success("Setup complete!", { description: "Cousin linked successfully." });
          onComplete();
        },
        onError: (err) => {
          toast.error("Failed", { description: err.message || "Make sure you are the admin." });
        }
      }
    );
  }

  if (!adminId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 glass-panel border-primary/30 shadow-neon">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-bold text-center mb-2">Welcome!</h2>
            <p className="text-center text-muted-foreground mb-2">
              No admin has been set up yet.
            </p>
            <div className="bg-muted/40 rounded-lg p-3 mb-6 flex gap-2 items-start">
              <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                If you are the admin (the one managing points), click below to claim admin. 
                If you are the cousin, ask the admin to log in first and set things up.
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 mb-6 text-center">
              <p className="text-xs text-muted-foreground mb-1">Your User ID (share with cousin/admin)</p>
              <p className="font-mono text-sm text-primary font-bold select-all">{userId}</p>
            </div>
            <Button
              onClick={handleClaimAdmin}
              disabled={claiming}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-primary/50 transition-all"
            >
              {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim Admin Role"}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Check if current user is the admin by seeing if they can access the set-cousin endpoint
  // For now, we'll show admin form to anyone if adminId exists, but cousin sees waiting screen
  // The actual role check happens server-side when they submit
  const isFormSubmitted = form.formState.isDirty;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 glass-panel border-primary/30 shadow-neon">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-center mb-2">Setup in Progress</h2>
          <p className="text-center text-muted-foreground mb-4">
            The admin is setting everything up. Please share your User ID with them.
          </p>
          <div className="bg-muted/40 rounded-lg p-3 mb-4 flex gap-2 items-start">
            <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Once the admin links you, you'll automatically have access to the game.
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-3 mb-6 text-center border-2 border-primary/50">
            <p className="text-xs text-muted-foreground mb-2">Your User ID</p>
            <p className="font-mono text-lg text-primary font-bold select-all break-all">{userId}</p>
            <p className="text-xs text-muted-foreground mt-2">👆 Copy and share this with the admin</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Admin Form (if you're the admin):</p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cousinId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 text-xs">Cousin's User ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Paste cousin's ID here"
                          {...field}
                          className="bg-background/50 h-10 text-sm border-white/10 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={settingCousin}
                >
                  {settingCousin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link Cousin"}
                </Button>
              </form>
            </Form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
