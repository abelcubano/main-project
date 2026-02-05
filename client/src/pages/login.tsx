import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { HardHat, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const easeOut = [0.16, 1, 0.3, 1] as const;

const fade = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

interface LoginPageProps {
  type: "admin" | "portal";
}

export default function LoginPage({ type }: LoginPageProps) {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = type === "admin";
  const title = isAdmin ? "Admin Console" : "Customer Portal";
  const redirectPath = isAdmin ? "/admin" : "/portal";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      setLocation(redirectPath);
    } else {
      setError(result.error || "Login failed");
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100 flex flex-col items-center justify-center p-4" data-testid="page-login">
      <motion.div variants={fade} initial="hidden" animate="show" className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <HardHat className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900">911-DC</h1>
          <p className="text-xs text-slate-500 mt-1">{title}</p>
        </div>

        <Card className="p-6 border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-slate-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="h-9 text-sm border-slate-200"
                required
                autoComplete="username"
                data-testid="input-username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-9 text-sm border-slate-200 pr-9"
                  required
                  autoComplete="current-password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Card>

        <div className="text-center mt-4">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-700">
            ← Back to Website
          </a>
        </div>
      </motion.div>
    </div>
  );
}
