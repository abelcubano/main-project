import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import PortalPage from "@/pages/portal";
import AdminPage from "@/pages/admin";
import LoginPage from "@/pages/login";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: "admin" | "customer" 
}) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    const loginPath = requiredRole === "admin" ? "/admin/login" : "/portal/login";
    return <Redirect to={loginPath} />;
  }

  if (requiredRole === "admin" && user.role !== "admin") {
    return <Redirect to="/portal" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/portal/login">
        <LoginPage type="portal" />
      </Route>
      <Route path="/admin/login">
        <LoginPage type="admin" />
      </Route>
      <Route path="/portal">
        <ProtectedRoute>
          <PortalPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
