import "./arcade.css";
import { watchScores } from "@/lib/arcade";
const Rooms = lazy(() => import("./pages/Rooms"));
import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { UsernameGate } from "@/components/UsernameGate";
import { DeviceProvider } from "@/lib/DeviceContext";
import Index from "./pages/Index";
const GamePage = lazy(() => import("./pages/GamePage"));
const EntertainmentPage = lazy(() => import("./pages/EntertainmentPage"));
const EntertainmentGamePage = lazy(() => import("./pages/EntertainmentGamePage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
import NotFound from "./pages/NotFound";
import { BigNotificationProvider } from "./components/BigNotification";
import { ensureAnonymousAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { getPlayerName } from "@/lib/streaks";
import { OfflineWarning } from "./components/OfflineWarning";
import { App as CapApp } from '@capacitor/app';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const queryClient = new QueryClient();

const AppFlow = () => {
  const [showSplash, setShowSplash] = useState(Capacitor.isNativePlatform());
  const [needsUsername, setNeedsUsername] = useState(() => !getPlayerName());

  useEffect(() => { if (!needsUsername) return watchScores(); }, [needsUsername]);

  useEffect(() => {
    const connectOnlineFeatures = () => {
      if (isSupabaseConfigured && navigator.onLine) {
        void ensureAnonymousAuth().catch(() => {
          // Online features can retry when they are opened.
        });
      }
    };
    connectOnlineFeatures();
    window.addEventListener("online", connectOnlineFeatures);

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
      window.removeEventListener("online", connectOnlineFeatures);
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
            ) : needsUsername ? (
              <UsernameGate onComplete={() => setNeedsUsername(false)} />
            ) : (
              <BrowserRouter>
                <Suspense fallback={<div className="club-page" role="status">Loading game…</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/game/:id" element={<GamePage />} />
                  <Route path="/entertainment" element={<EntertainmentPage />} />
                  <Route path="/entertainment/:id" element={<EntertainmentGamePage />} />
                  <Route path="/rooms" element={<Rooms/>} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
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
