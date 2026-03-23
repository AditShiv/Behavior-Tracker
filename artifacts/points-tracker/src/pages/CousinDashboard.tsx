import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import { Coins, History, Trophy, ArrowRight, Loader2, Gamepad2, Gift } from "lucide-react";
import { toast } from "sonner";

import { useGetMyPoints, useGetPointsHistory } from "@/hooks/use-points";
import { useCreateRedemption, useListRedemptions } from "@/hooks/use-redemptions";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

const POINTS_PER_ROBUX = 1000;

const redeemSchema = z.object({
  robuxAmount: z.coerce.number().min(1, "Must be at least 1 Robux"),
});

export function CousinDashboard() {
  const { data: pointsData, isLoading: pointsLoading } = useGetMyPoints();
  const { data: historyData } = useGetPointsHistory();
  const { data: redemptionsData } = useListRedemptions();
  
  const { mutate: createRedemption, isPending: isRedeeming } = useCreateRedemption();

  const form = useForm<z.infer<typeof redeemSchema>>({
    resolver: zodResolver(redeemSchema),
    defaultValues: { robuxAmount: 1 },
  });

  const currentPoints = pointsData?.points ?? 0;
  const watchRobux = form.watch("robuxAmount") || 0;
  const currentCost = watchRobux * POINTS_PER_ROBUX;
  const canAfford = currentPoints >= currentCost && watchRobux >= 1;

  function onRedeem(values: z.infer<typeof redeemSchema>) {
    createRedemption(
      { data: { robuxAmount: values.robuxAmount } },
      {
        onSuccess: () => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#06b6d4', '#ffffff']
          });
          toast.success("Request Sent!", { description: `Your request for ${values.robuxAmount} Robux is pending approval.` });
          form.reset();
        },
        onError: (err) => {
          toast.error("Redemption Failed", { description: err.message });
        }
      }
    );
  }

  const recentRedemptions = redemptionsData?.redemptions.slice(-3).reverse() || [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold">Player Dashboard</h1>
          <p className="text-muted-foreground mt-1">Behave, earn points, get Robux.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Points Display & Redeem Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
              <div>
                <p className="text-accent font-bold tracking-wider uppercase mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> Current Balance
                </p>
                <div className="flex items-baseline gap-2">
                  {pointsLoading ? (
                    <div className="h-16 w-32 bg-white/10 animate-pulse rounded-lg" />
                  ) : (
                    <>
                      <span className="text-6xl sm:text-7xl font-display font-black text-gradient">
                        {currentPoints.toLocaleString()}
                      </span>
                      <span className="text-xl text-muted-foreground font-bold">pts</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-background/50 border border-white/10 rounded-2xl p-4 text-center min-w-[160px]">
                <p className="text-sm text-muted-foreground mb-1">Exchange Rate</p>
                <p className="font-bold text-lg text-white flex items-center justify-center gap-2">
                  1 R$ <ArrowRight className="w-4 h-4 text-primary" /> 1,000 pts
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl font-bold font-display">Redeem Robux</h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onRedeem)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="robuxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 text-lg">How much Robux do you want?</FormLabel>
                      <FormControl>
                        <div className="relative mt-2">
                          <Gamepad2 className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                          <Input 
                            type="number" 
                            {...field} 
                            className="pl-14 bg-background/50 h-16 text-2xl font-bold border-white/10 focus:border-primary shadow-inner"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center p-4 rounded-xl bg-background/50 border border-white/5">
                  <span className="text-muted-foreground font-semibold">Cost:</span>
                  <span className={`text-xl font-bold font-display ${canAfford ? 'text-white' : 'text-destructive'}`}>
                    {currentCost.toLocaleString()} pts
                  </span>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full h-16 text-xl font-bold transition-all ${
                    canAfford 
                      ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-neon text-white hover:scale-[1.01]' 
                      : 'bg-muted text-muted-foreground border border-white/10'
                  }`}
                  disabled={!canAfford || isRedeeming}
                >
                  {isRedeeming ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                   !canAfford ? "Not Enough Points" : "Send Request"}
                </Button>
              </form>
            </Form>
          </Card>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          <Card className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold font-display">Recent Activity</h3>
            </div>
            
            <div className="space-y-4">
              {historyData?.entries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No points earned yet.</p>
              ) : (
                historyData?.entries.slice(-5).reverse().map(entry => (
                  <div key={entry.id} className="flex justify-between items-start p-3 bg-background/30 rounded-lg border border-white/5">
                    <div>
                      <p className="font-semibold text-sm text-foreground/90 leading-tight">{entry.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(entry.createdAt), "MMM d")}</p>
                    </div>
                    <span className={`font-bold ml-3 flex-shrink-0 ${entry.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {entry.amount > 0 ? '+' : ''}{entry.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-bold font-display mb-4">My Requests</h3>
            <div className="space-y-3">
              {recentRedemptions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No requests yet.</p>
              ) : (
                recentRedemptions.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/5">
                    <span className="font-bold">{r.robuxAmount} R$</span>
                    <Badge variant="outline" className={`
                      ${r.status === 'pending' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : ''}
                      ${r.status === 'accepted' ? 'border-success text-success bg-success/10' : ''}
                      ${r.status === 'denied' ? 'border-destructive text-destructive bg-destructive/10' : ''}
                    `}>
                      {r.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
