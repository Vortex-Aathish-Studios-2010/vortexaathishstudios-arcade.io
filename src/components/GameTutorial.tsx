import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GameInfo } from "@/lib/gameData";

interface GameTutorialProps {
  game: GameInfo;
  open: boolean;
  onClose: () => void;
}

export const GameTutorial = ({ game, open, onClose }: GameTutorialProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <span className="text-2xl">{game.icon}</span> How to Play {game.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {game.description}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 mt-2">
          {game.tutorial.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-foreground">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-display text-xs flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm hover:bg-primary/90 transition-colors"
        >
          GOT IT!
        </button>
      </DialogContent>
    </Dialog>
  );
};
