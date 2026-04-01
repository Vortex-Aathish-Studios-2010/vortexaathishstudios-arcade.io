import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";

export const ContactModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const handleSubmit = () => {
    if (!suggestion.trim()) return;
    toast.success("Thanks for the suggestion! 🎮");
    setSuggestion("");
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[90] p-3 rounded-full bg-primary/20 border border-primary/40 text-primary hover:bg-primary/40 hover:glow-primary transition-all backdrop-blur-sm"
        title="Suggestions"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-primary/40 rounded-2xl p-6 max-w-sm w-full relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="font-display text-xl text-primary font-bold tracking-widest mb-2 text-center">
                SUGGESTIONS
              </h2>
              <p className="text-muted-foreground text-sm font-display text-center mb-6">
                Have an idea for a new game or feature? Let us know!
              </p>

              <div className="space-y-4">
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Type your suggestion here..."
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary outline-none resize-none"
                />
                <button
                  onClick={handleSubmit}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-display text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  SEND SUGGESTION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
