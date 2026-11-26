import { useEffect, useRef } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    const timer = window.setTimeout(() => complete.current(), 1600);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="studio-splash">
      <img src="/arcade-icon.png" alt="" />
      <h1>ARCADE.IO</h1>
      <p>Vortex Aathish Studios</p>
      <small>Created by the Kannayil Brothers</small>
    </div>
  );
}
