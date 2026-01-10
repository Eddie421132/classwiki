import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlassBackground } from "@/components/GlassBackground";
import { IpBanCheck } from "@/components/IpBanCheck";
import { OnlineStatusProvider } from "@/components/OnlineStatusProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserAuth from "./pages/UserAuth";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import Editor from "./pages/Editor";
import Search from "./pages/Search";
import Article from "./pages/Article";
import Articles from "./pages/Articles";
import EditorProfile from "./pages/EditorProfile";
import Settings from "./pages/Settings";
import Drafts from "./pages/Drafts";
import Changelog from "./pages/Changelog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlassBackground />
      <IpBanCheck>
        <BrowserRouter>
          <AuthProvider>
            <OnlineStatusProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/user-auth" element={<UserAuth />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/editor" element={<Editor />} />
                <Route path="/search" element={<Search />} />
                <Route path="/article/:id" element={<Article />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/profile/:userId" element={<EditorProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/drafts" element={<Drafts />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OnlineStatusProvider>
          </AuthProvider>
        </BrowserRouter>
      </IpBanCheck>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
