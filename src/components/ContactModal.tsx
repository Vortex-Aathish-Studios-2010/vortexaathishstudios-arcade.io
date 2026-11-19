import { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ContactModal() {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="suggestion-trigger">
          <MessageSquare size={16} />
          Suggestions
        </button>
      </DialogTrigger>
      <DialogContent className="profile-dialog">
        <DialogTitle>Suggestions</DialogTitle>
        <DialogDescription>
          What game or feature would you like to see?
        </DialogDescription>
        <form
          className="profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!suggestion.trim()) return;
            toast.success("Thanks for the suggestion!");
            setSuggestion("");
            setOpen(false);
          }}
        >
          <label>
            Your suggestion
            <textarea
              value={suggestion}
              onChange={(event) => setSuggestion(event.target.value)}
              rows={4}
              required
            />
          </label>
          <button className="solid-button" disabled={!suggestion.trim()}>
            Send suggestion
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
