import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlassBackground } from "@/components/GlassBackground";
import { IpBanCheck } from "@/components/IpBanCheck";
import { OnlineStatusProvider } from "@/components/OnlineStatusProvider";
import { AutoLoginProvider } from "@/components/AutoLoginProvider";
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

// 滚动位置管理组件 - 进入文章时保存位置，返回时恢复
function ScrollRestoration() {
  const { pathname } = useLocation();
  const prevPathRef = useRef<string>('');
  const scrollPositions = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const isEnteringArticle = pathname.startsWith('/article/') && !prevPath.startsWith('/article/');
    const isLeavingArticle = !pathname.startsWith('/article/') && prevPath.startsWith('/article/');

    if (isEnteringArticle) {
      // 进入文章页面时，保存当前页面的滚动位置
      scrollPositions.current.set(prevPath, window.scrollY);
    } else if (isLeavingArticle) {
      // 离开文章页面时，恢复之前保存的滚动位置
      const savedPosition = scrollPositions.current.get(pathname);
      if (savedPosition !== undefined) {
        // 使用 setTimeout 确保页面渲染完成后再滚动
        setTimeout(() => {
          window.scrollTo(0, savedPosition);
        }, 0);
      }
    } else if (!pathname.startsWith('/article/')) {
      // 其他页面间导航，滚动到顶部
      window.scrollTo(0, 0);
    }

    prevPathRef.current = pathname;
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlassBackground />
        <IpBanCheck>
          <AutoLoginProvider>
            <BrowserRouter>
              <ScrollRestoration />
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
          </AutoLoginProvider>
        </IpBanCheck>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
