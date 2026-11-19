import { Link, NavLink, Outlet } from "react-router-dom";
import { LibraryBig, UsersRound, Trophy, UserRound } from "lucide-react";
import { useState } from "react";
import { getPlayerName } from "@/lib/streaks";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UsernameGate } from "./UsernameGate";

const destinations = [
  { to: "/", label: "Library", icon: LibraryBig },
  { to: "/rooms", label: "Rooms", icon: UsersRound },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];
export function ArcadeShell({ onProfile }: { onProfile: () => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="studio-shell">
      <header className="studio-bar">
        <div className="bar-inner">
          <Link to="/" aria-label="Arcade.io home" className="studio-brand">
            <img src="/arcade-icon.png" alt="" />
            <span>
              ARCADE<span>.IO</span>
            </span>
          </Link>
          <nav aria-label="Arcade navigation" className="studio-nav">
            {destinations.map(({ to, label, icon: Icon }) => (
              <NavLink end key={to} to={to}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            className="profile-btn"
            onClick={() => setEditing(true)}
            aria-label="Edit player name"
          >
            <UserRound size={17} />
            <span>{getPlayerName() || "Player name"}</span>
          </button>
        </div>
      </header>
      <Outlet />
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="profile-dialog">
          <DialogTitle>Player profile</DialogTitle>
          <UsernameGate
            onComplete={() => {
              onProfile();
              setEditing(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
