import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  PlusCircle, MinusCircle, ShieldAlert, Check, X,
  Coins, History, MessagesSquare, ArrowRight, Loader2
} from "lucide-react";
import { toast } from "sonner";

import { useAdjustPoints, useGetMyPoints, useGetPointsHistory } from "@/hooks/use-points";
import { useListRedemptions, useReviewRedemption } from "@/hooks/use-redemptions";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const adjustSchema = z.object({
  amount: z.coerce.number().min(1, "Must be at least 1 point"),
  action: z.enum(["add", "deduct"]),
  reason: z.string().min(3, "Reason is required so they know why!"),
});

export function AdminDashboard() {
  const { data: pointsData } = useGetMyPoints(); // Might return admin's points or 0 if backend isn't mapped, but we render it
  const { data: historyData } = useGetPointsHistory();
  const { data: redemptionsData } = useListRedemptions();
  
  const { mutate: adjustPoints, isPending: isAdjusting } = useAdjustPoints();

  const form = useForm<z.infer<typeof adjustSchema>>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { amount: 100, action: "add", reason: "" },
  });

  function onAdjustSubmit(values: z.infer<typeof adjustSchema>) {
    const finalAmount = values.action === "add" ? values.amount : -values.amount;
    adjustPoints(
      { data: { amount: finalAmount, reason: values.reason } },
      {
        onSuccess: () => {
          toast.success("Points Adjusted!", { 
            description: `${values.action === 'add' ? 'Added' : 'Deducted'} ${values.amount} points.` 
          });
          form.reset({ amount: 100, action: "add", reason: "" });
        },
        onError: (err) => {
          toast.error("Failed to adjust points", { description: err.message });
        }
      }
    );
  }

  const pendingRedemptions = redemptionsData?.redemptions.filter(r => r.status === "pending") || [];
  const completedRedemptions = redemptionsData?.redemptions.filter(r => r.status !== "pending") || [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold">Admin Hub</h1>
          <p className="text-muted-foreground mt-1">Manage points, review requests, enforce the rules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Adjust Points Form */}
        <Card className="lg:col-span-2 glass-panel p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-display">Adjust Points</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAdjustSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={field.value === "add" ? "default" : "outline"}
                        className={`h-16 text-lg border-2 ${field.value === 'add' ? 'bg-success hover:bg-success/90 border-success shadow-[0_0_15px_rgba(0,255,100,0.3)]' : 'border-white/10 hover:border-white/20'}`}
                        onClick={() => field.onChange("add")}
                      >
                        <PlusCircle className="w-6 h-6 mr-2" /> Give Points
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "deduct" ? "default" : "outline"}
                        className={`h-16 text-lg border-2 ${field.value === 'deduct' ? 'bg-destructive hover:bg-destructive/90 border-destructive shadow-[0_0_15px_rgba(255,0,50,0.3)]' : 'border-white/10 hover:border-white/20'}`}
                        onClick={() => field.onChange("deduct")}
                      >
                        <MinusCircle className="w-6 h-6 mr-2" /> Take Points
                      </Button>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="text-foreground/80">Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input 
                            type="number" 
                            {...field} 
                            className="pl-10 bg-background/50 h-12 text-lg border-white/10 focus:border-primary"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-foreground/80">Reason</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Did the dishes / Was annoying" 
                          {...field} 
                          className="bg-background/50 h-12 text-lg border-white/10 focus:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-[1.01] transition-all"
                disabled={isAdjusting}
              >
                {isAdjusting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Execute Decision"}
              </Button>
            </form>
          </Form>
        </Card>

        {/* Pending Requests */}
        <Card className="glass-panel p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <MessagesSquare className="w-5 h-5 text-accent" />
              Pending Requests
            </h2>
            <Badge variant="secondary" className="bg-accent/20 text-accent font-bold">
              {pendingRedemptions.length}
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
            {pendingRedemptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center border border-dashed border-white/10 rounded-xl">
                <Check className="w-12 h-12 mb-2 opacity-20" />
                <p>No pending requests.</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              pendingRedemptions.map(r => (
                <ReviewCard key={r.id} redemption={r} />
              ))
            )}
          </div>
        </Card>

      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-12 bg-background/50 p-1 border border-white/10">
          <TabsTrigger value="history" className="text-base rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Activity History</TabsTrigger>
          <TabsTrigger value="reviewed" className="text-base rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reviewed Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-6">
          <Card className="glass-panel p-2 sm:p-6">
            {historyData?.entries.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">No history yet.</p>
            ) : (
              <div className="space-y-2">
                {historyData?.entries.slice().reverse().map(entry => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={entry.id} 
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                  >
                    <div>
                      <p className="font-semibold text-foreground/90">{entry.reason}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    <div className={`font-bold text-lg font-display ${entry.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {entry.amount > 0 ? '+' : ''}{entry.amount} pts
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reviewed" className="mt-6">
          <Card className="glass-panel p-2 sm:p-6">
            {completedRedemptions.length === 0 ? (
               <p className="text-center text-muted-foreground p-8">No reviewed requests yet.</p>
            ) : (
              <div className="space-y-4">
                {completedRedemptions.slice().reverse().map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-white/5">
                    <div>
                      <p className="font-bold font-display text-lg">{r.robuxAmount} Robux</p>
                      <p className="text-sm text-muted-foreground">Requested on {format(new Date(r.createdAt), "MMM d, yyyy")}</p>
                      {r.note && <p className="text-sm text-foreground/80 mt-1 italic border-l-2 border-white/20 pl-2">"{r.note}"</p>}
                    </div>
                    <Badge variant="outline" className={`px-3 py-1 ${r.status === 'accepted' ? 'border-success text-success bg-success/10' : 'border-destructive text-destructive bg-destructive/10'}`}>
                      {r.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewCard({ redemption }: { redemption: any }) {
  const { mutate: review, isPending } = useReviewRedemption();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState<"accept" | "deny" | null>(null);

  function handleReview(action: "accept" | "deny") {
    review(
      { id: redemption.id, data: { action, note } },
      {
        onSuccess: () => {
          toast.success(`Request ${action === 'accept' ? 'Accepted' : 'Denied'}`);
          setOpen(false);
        },
        onError: (err) => {
          toast.error("Failed to review", { description: err.message });
        }
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="p-4 rounded-xl bg-background/50 border border-primary/20 hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold font-display text-lg text-primary group-hover:text-primary-foreground transition-colors">
              {redemption.robuxAmount} Robux
            </span>
            <span className="text-sm text-muted-foreground">
              {redemption.pointsCost} pts
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {format(new Date(redemption.createdAt), "MMM d")}
            </span>
            <span className="text-accent flex items-center group-hover:translate-x-1 transition-transform">
              Review <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="glass-panel border-primary/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Review Request</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl mb-6 border border-white/5">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Requested Amount</p>
              <p className="text-2xl font-bold font-display text-primary">{redemption.robuxAmount} R$</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Cost</p>
              <p className="text-xl font-bold">{redemption.pointsCost} pts</p>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <label className="text-sm font-semibold text-foreground/80">Add a note (optional)</label>
            <Textarea 
              placeholder="Why are you accepting/denying?"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="bg-background/50 border-white/10 focus:border-primary resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline"
              className="h-14 border-destructive text-destructive hover:bg-destructive hover:text-white"
              onClick={() => { setActionType("deny"); handleReview("deny"); }}
              disabled={isPending}
            >
              {isPending && actionType === "deny" ? <Loader2 className="w-5 h-5 animate-spin" /> : <><X className="w-5 h-5 mr-2" /> Deny</>}
            </Button>
            <Button 
              className="h-14 bg-success hover:bg-success/90 text-success-foreground shadow-[0_0_15px_rgba(0,255,100,0.2)]"
              onClick={() => { setActionType("accept"); handleReview("accept"); }}
              disabled={isPending}
            >
              {isPending && actionType === "accept" ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Accept</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
