import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThreeCupsGame } from "@/components/games/ThreeCupsGame";
import { UsernameGate } from "@/components/UsernameGate";
import { getGameLevel, getEntertainmentPoints, getStreak, getDailyStreak, updateStreak, getPlayerAvatar, getPlayerName } from "@/lib/streaks";
import { shellSettings } from "@/lib/shellGame";
vi.mock("@/lib/sounds",()=>({sfx:{place:vi.fn(),correct:vi.fn(),error:vi.fn()}}));
beforeEach(()=>{localStorage.clear();vi.useFakeTimers();vi.setSystemTime(new Date(2026,10,26,12));});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();});
it("makes each Shell level faster without an unreadable first round",()=>{
 expect(shellSettings(1).duration).toBe(1000);expect(shellSettings(1).swaps).toBe(3);
 for(let level=2;level<=100;level++)expect(shellSettings(level).duration).toBeLessThan(shellSettings(level-1).duration);
});
it("finishes shuffles before accepting a guess, saves wins and drops one level on a loss",()=>{
 vi.spyOn(Math,"random").mockReturnValue(0); const complete=vi.fn();
 render(<ThreeCupsGame onComplete={complete}/>);
 fireEvent.click(screen.getByRole("button",{name:"Play level 1"}));
 expect(screen.getByRole("button",{name:"Cup 1"})).toBeDisabled();
 // Three deterministic swaps move ball id 0 from slot 1 to slot 2.
 act(()=>vi.advanceTimersByTime(6000));
 fireEvent.click(screen.getByRole("button",{name:"Cup 2"}));
 expect(getGameLevel("three-cups")).toBe(2);expect(getEntertainmentPoints()).toBe(10);
 expect(getStreak("three-cups")).toBe(1);expect(complete).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button",{name:"Cup 2"}));expect(complete).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button",{name:"Continue · level 2"}));
 act(()=>vi.advanceTimersByTime(6000));
 fireEvent.click(screen.getByRole("button",{name:"Cup 1"}));
 expect(getGameLevel("three-cups")).toBe(1);expect(getEntertainmentPoints()).toBe(10);
 expect(getStreak("three-cups")).toBe(1);expect(complete).toHaveBeenLastCalledWith(0,false);
});
it("counts consecutive calendar days once and resets after a missed day",()=>{
 updateStreak("three-cups");updateStreak("three-cups");expect(getDailyStreak()).toBe(1);
 vi.setSystemTime(new Date(2026,10,27,9));updateStreak("three-cups");expect(getStreak("three-cups")).toBe(2);
 vi.setSystemTime(new Date(2026,10,29,9));expect(getStreak("three-cups")).toBe(0);
 updateStreak("three-cups");expect(getDailyStreak()).toBe(1);
});
it("persists a username and one of ten selectable avatars",()=>{
 const complete=vi.fn();render(<UsernameGate onComplete={complete}/>);
 expect(screen.getAllByRole("button",{name:/Choose .* avatar/})).toHaveLength(10);
 fireEvent.change(screen.getByRole("textbox",{name:"Username"}),{target:{value:"  Vortex  "}});
 fireEvent.click(screen.getByRole("button",{name:"Choose Fox avatar"}));
 fireEvent.click(screen.getByRole("button",{name:"Save profile"}));
 expect(getPlayerName()).toBe("Vortex");expect(getPlayerAvatar()).toBe("fox");expect(complete).toHaveBeenCalledWith("Vortex");
});
