import { useEffect, useRef } from "react";
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    const timer = setTimeout(() => complete.current(), 2400);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="arcade-boot">
      <div className="boot-frame" />
      <div className="boot-mark">
        <img src="/arcade-icon.png" alt="" />
        <div className="boot-word" aria-label="Arcade.io">
          {"ARCADE".split("").map((letter, i) => (
            <span key={i} style={{ animationDelay: i * 70 + "ms" }}>
              {letter}
            </span>
          ))}
          <em>.IO</em>
        </div>
        <p>VORTEX AATHISH STUDIOS</p>
        <div className="boot-progress">
          <i />
        </div>
        <button onClick={() => complete.current()}>Enter arcade</button>
      </div>
      <div className="boot-credits">
        <div>
          <span>FOUNDER</span>
          <strong>Aathish Kannayil Ajesh</strong>
        </div>
        <div>
          <span>CO-FOUNDER</span>
          <strong>Aagney Kannayil Aajehs</strong>
        </div>
      </div>
    </div>
  );
}
