import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mail, Instagram, X } from "lucide-react";

export const ContactModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[90] p-3 rounded-full bg-primary/20 border border-primary/40 text-primary hover:bg-primary/40 hover:glow-primary transition-all backdrop-blur-sm"
        title="Suggestions & Contact"
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
                <div className="flex items-center gap-4 bg-background p-4 rounded-xl border border-primary/20">
                  <Mail className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-display tracking-wider">Email</p>
                    <p className="font-mono text-sm text-white select-all">aathish.k720.2@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-background p-4 rounded-xl border border-[#E1306C]/20">
                  <Instagram className="w-6 h-6 text-[#E1306C]" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-display tracking-wider">Instagram</p>
                    <p className="font-mono text-sm text-white select-all">s.a.aa_072010</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
