import { useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Gamepad2, Trophy, UsersRound, UserRound } from "lucide-react";
import { getPlayerName } from "@/lib/streaks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactModal } from "./ContactModal";
import { UsernameGate } from "./UsernameGate";

const destinations = [
  { to: "/", label: "Library", icon: Gamepad2 },
  { to: "/rooms", label: "Rooms", icon: UsersRound },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function ArcadeShell({ onProfile }: { onProfile: () => void }) {
  const [editing, setEditing] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    panel.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="studio-shell">
      <header className="app-chrome">
        <Link to="/" aria-label="Arcade.io home" className="studio-brand">
          <img src="/arcade-icon.png" alt="" width="40" height="40" />
          <span>
            ARCADE<span>.IO</span>
          </span>
        </Link>
        <nav aria-label="Arcade navigation" className="studio-nav">
          {destinations.map(({ to, label, icon: Icon }) => (
            <NavLink end key={to} to={to}>
              <Icon size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="profile-btn"
          onClick={() => setEditing(true)}
          aria-label="Edit player name"
        >
          <span className="avatar-icon">
            <UserRound size={19} />
          </span>
          <span>{getPlayerName() || "Player profile"}</span>
        </button>
      </header>
      <div className="app-panel" ref={panel}>
        <Outlet />
      </div>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="profile-dialog">
          <DialogTitle>Player profile</DialogTitle>
          <DialogDescription className="sr-only">
            Edit your arcade player name.
          </DialogDescription>
          <UsernameGate
            onComplete={() => {
              onProfile();
              setEditing(false);
            }}
          />
          <div className="profile-about">
            <span>Vortex Aathish Studios</span>
            <ContactModal />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
