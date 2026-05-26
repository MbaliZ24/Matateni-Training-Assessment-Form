import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAppStore, dashboardRouteByRole } from "../../store/app-store";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState("trainer@matateni.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1400px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:grid-cols-[1.04fr_1fr]">
        <section className="relative hidden overflow-hidden bg-[#081f57] p-10 text-white md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.15),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(165,42,53,0.22),transparent_40%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10">
            <img src="/matateni-logo.png" alt="Matateni" className="h-14 w-auto rounded-md bg-white/90 p-2" />
            <h1 className="mt-12 max-w-lg text-5xl font-bold leading-tight">Training that builds skills. Assessment that drives excellence.</h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[#a52a35]" />
            <p className="mt-8 max-w-xl text-xl text-slate-100">Enterprise workflow for training effectiveness, compliance, and accountable sign-off.</p>
          </div>
        </section>

        <section className="flex items-center bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4 md:p-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg md:p-10">
            <h2 className="text-center text-4xl font-bold text-[#0c1f55]">Welcome back!</h2>
            <p className="mt-2 text-center text-lg text-slate-500">Sign in to your account to continue</p>
            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const ok = login(email, password);
                if (!ok) {
                  setError("Invalid credentials");
                  return;
                }
                setError("");
                const current = useAppStore.getState().currentUser;
                if (current) navigate(dashboardRouteByRole(current.role));
              }}
            >
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email address</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@matateni.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600"><input type="checkbox" /> Remember me</label>
                <button type="button" className="font-medium text-[#0c1f55] hover:text-[#a52a35]">Forgot password?</button>
              </div>
              {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
              <Button className="w-full" size="lg">Sign In</Button>
            </form>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
