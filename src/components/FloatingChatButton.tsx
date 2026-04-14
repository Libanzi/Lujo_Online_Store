import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatModal } from "./ChatModal";

export const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary transition-all hover:scale-110"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};
