import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@workspace/replit-auth-web";

interface Message {
  id: number;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
}

interface ChatProps {
  user: AuthUser;
}

export function Chat({ user }: ChatProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messagesData, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ["chat", "messages"],
    queryFn: async () => {
      const response = await fetch("/api/chat/messages", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    refetchInterval: 2000,
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
      setMessageText("");
    },
    onError: (err) => {
      toast.error("Failed to send message", { description: err.message });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessage(messageText);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/20 rounded-xl">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Chat</h1>
          <p className="text-muted-foreground">Messages between you and the other user</p>
        </div>
      </div>

      <Card className="glass-panel flex-1 flex flex-col p-6 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-4">
              {messagesData?.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messagesData?.messages.map((msg, idx) => {
                  const isOwn = msg.senderId === user.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-xl ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/10 text-foreground"
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">{msg.senderUsername}</p>
                        <p className="break-words">{msg.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-background/50 border-white/10 focus:border-primary h-12"
              />
              <Button
                type="submit"
                disabled={isSending || !messageText.trim()}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12 px-6"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
