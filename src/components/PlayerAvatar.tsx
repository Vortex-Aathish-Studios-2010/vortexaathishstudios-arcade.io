import { publicAsset } from "@/lib/assets";
export const AVATARS = [
  { id: "orbit", name: "Orbit" },
  { id: "fox", name: "Fox" },
  { id: "bot", name: "Byte" },
  { id: "ninja", name: "Shade" },
  { id: "owl", name: "Scout" },
  { id: "cat", name: "Miso" },
  { id: "dragon", name: "Drake" },
  { id: "skull", name: "Bones" },
  { id: "diver", name: "Reef" },
  { id: "bear", name: "Bruno" },
];
export function PlayerAvatar({
  id = "orbit",
  size = 48,
  className = "",
}: {
  id?: string;
  size?: number;
  className?: string;
}) {
  const index = Math.max(
    0,
    AVATARS.findIndex((a) => a.id === id),
  );
  return (
    <span
      className={"player-avatar portrait-avatar " + className}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${publicAsset("avatars.png")})`,
        backgroundSize: "500% 200%",
        backgroundPosition: `${(index % 5) * 25}% ${Math.floor(index / 5) * 100}%`,
      }}
    />
  );
}
