import "./arcade.css";
import { watchScores } from "@/lib/arcade";
import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArcadeShell } from "./components/ArcadeShell";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { UsernameGate } from "@/components/UsernameGate";
import { DeviceProvider } from "@/lib/DeviceContext";
import Index from "./pages/Index";
const GamePage = lazy(() => import("./pages/GamePage"));
const EntertainmentGamePage = lazy(() => import("./pages/EntertainmentGamePage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
import NotFound from "./pages/NotFound";
import { BigNotificationProvider } from "./components/BigNotification";
import { getPlayerName } from "@/lib/streaks";
import { OfflineWarning } from "./components/OfflineWarning";
import { App as CapApp } from '@capacitor/app';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const Rooms = lazy(() => import("./pages/Rooms"));

const queryClient = new QueryClient();

const AppFlow = () => {
  const [showSplash, setShowSplash] = useState(Capacitor.isNativePlatform());
  const [needsUsername, setNeedsUsername] = useState(() => !getPlayerName());

  useEffect(() => watchScores(), []);
  useEffect(() => {
    const profileChanged = () => setNeedsUsername(!getPlayerName());
    window.addEventListener("arcade-profile", profileChanged);
    return () => window.removeEventListener("arcade-profile", profileChanged);
  }, []);

  useEffect(() => {
    const initCapacitor = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        await CapSplashScreen.hide();
      } catch (e) {
        // Not running in Capacitor / error
      }

      if (!Capacitor.isNativePlatform()) return;
      try {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            CapApp.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch(e) {}
    };
    initCapacitor();

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        import("@/lib/sounds").then(({ sfx }) => sfx.click?.());
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      if (Capacitor.isNativePlatform()) void CapApp.removeAllListeners();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <BigNotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineWarning />
            {showSplash ? (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            ) : (
              <BrowserRouter>
                <Suspense fallback={<div className="club-page" role="status">Loading game…</div>}>
                <Routes>
                  <Route element={<ArcadeShell onProfile={() => setNeedsUsername(false)}/>}>
                    <Route path="/" element={<Index/>}/>
                    <Route path="/entertainment" element={<Navigate replace to="/?mode=action"/>}/>
                    <Route path="/rooms" element={needsUsername ? <main className="club-page"><section className="club-wrap"><header className="club-title"><h1>Play with friends</h1></header><UsernameGate onComplete={()=>setNeedsUsername(false)}/></section></main> : <Rooms/>}/>
                    <Route path="/leaderboard" element={<LeaderboardPage/>}/>
                  </Route>
                  <Route path="/game/:id" element={<GamePage/>}/>
                  <Route path="/entertainment/:id" element={<EntertainmentGamePage/>}/>
                  <Route path="*" element={<NotFound />} />
                </Routes></Suspense>
              </BrowserRouter>
            )}
          </TooltipProvider>
        </BigNotificationProvider>
      </DeviceProvider>
    </QueryClientProvider>
  );
};

export default AppFlow;
