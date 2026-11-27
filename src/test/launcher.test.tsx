import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import { ArcadeShell } from "@/components/ArcadeShell";
import { DeviceProvider } from "@/lib/DeviceContext";
import { BigNotificationProvider } from "@/components/BigNotification";
import Index from "@/pages/Index";
import GamePage from "@/pages/GamePage";

beforeEach(() => {
  localStorage.clear();
  HTMLElement.prototype.scrollTo = () => {};
});

function renderLauncher() {
  return render(
    <MemoryRouter>
      <DeviceProvider>
        <BigNotificationProvider>
          <Routes>
            <Route element={<ArcadeShell onProfile={() => {}} />}>
              <Route path="/" element={<Index />} />
              <Route path="/leaderboard" element={<h1>Rankings</h1>} />
            </Route>
            <Route path="/game/:id" element={<GamePage />} />
          </Routes>
        </BigNotificationProvider>
      </DeviceProvider>
    </MemoryRouter>,
  );
}

it("replaces quick launch with the game the player just opened", () => {
  renderLauncher();
  const quick = screen.getByRole("region", { name: "Quick launch" });
  fireEvent.click(within(quick).getByRole("link", { name: /Memory Match/ }));
  fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
  fireEvent.click(screen.getByRole("button", { name: "BACK" }));
  const recent = screen.getByRole("region", { name: "Recently played" });
  expect(within(recent).getAllByRole("link")).toHaveLength(1);
  expect(
    within(recent).getByRole("link", { name: /Memory Match/ }),
  ).toHaveAttribute("href", "/game/memory");
});

it("keeps category selection when returning from play and exposes the active navigation tab", () => {
  renderLauncher();
  fireEvent.click(screen.getByRole("button", { name: "Puzzles" }));
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Memory" },
  });
  fireEvent.click(screen.getByRole("link", { name: /Memory Match/ }));
  fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
  fireEvent.click(screen.getByRole("button", { name: "BACK" }));
  expect(screen.getByRole("button", { name: "Puzzles" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("searchbox")).toHaveValue("Memory");
  const nav = screen.getByRole("navigation", { name: "Arcade navigation" });
  fireEvent.click(within(nav).getByRole("link", { name: "Rankings" }));
  expect(
    within(nav).getByRole("link", { name: "Rankings" }),
  ).toHaveAttribute("aria-current", "page");
});
