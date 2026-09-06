import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, AlertCircle, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const roleHome = { admin: "/admin", teamlead: "/lead", member: "/member" };

const SocialButton = ({ onClick, label, logo }) => (
  <button type="button" onClick={onClick} className="btn-secondary w-full !justify-start gap-3">
    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{logo}</span>
    {label}
  </button>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C41 35.9 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
);
const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
);
const GithubLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.12.82-.27.82-.6 0-.29-.01-1.06-.02-2.08-3.34.75-4.04-1.65-4.04-1.65-.55-1.42-1.34-1.8-1.34-1.8-1.1-.77.08-.75.08-.75 1.21.09 1.85 1.27 1.85 1.27 1.08 1.9 2.83 1.35 3.52 1.03.11-.8.42-1.35.77-1.66-2.67-.31-5.47-1.37-5.47-6.1 0-1.35.47-2.45 1.24-3.31-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.26a11.3 11.3 0 0 1 6 0c2.29-1.59 3.3-1.26 3.3-1.26.66 1.71.24 2.97.12 3.28.77.86 1.24 1.96 1.24 3.31 0 4.74-2.81 5.79-5.49 6.09.43.38.81 1.13.81 2.28 0 1.65-.02 2.98-.02 3.38 0 .33.22.72.83.6C20.57 22.34 24 17.74 24 12.3 24 5.5 18.63 0 12 0z"/></svg>
);

const Login = () => {
  const { loginWithEmail, loginWithProvider, needsWorkspace } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const afterLogin = (user) => {
    if (!user) return; // needsWorkspace case — banner will show
    navigate(roleHome[user.role] || "/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await loginWithEmail(form.email, form.password);
      afterLogin(user);
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleSocial = async (provider) => {
    setError(""); setLoading(true);
    try {
      const user = await loginWithProvider(provider);
      afterLogin(user);
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Sign-in failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex text-cream">
      <div className="hidden lg:flex lg:w-1/2 bg-white/[0.05] backdrop-blur-xl border-r border-white/[0.12] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-accent-amber/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-accent-blue/10 blur-3xl" />
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-cream text-base-950 flex items-center justify-center font-display font-bold">P</div>
          <span className="font-display font-semibold text-xl">Projenta</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight mb-4">One workspace. Every layer of the team.</h2>
          <p className="text-cream/60 text-sm leading-relaxed">
            Admins assign to team leads, leads assign to their people, and every task's
            time is tracked automatically — from start to finish.
          </p>
        </div>
        <p className="relative z-10 text-xs text-cream/40 font-mono">role: admin → teamlead → member</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-cream/50 mb-8">Sign in to your workspace</p>

          {needsWorkspace && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-accent-blue/15 text-accent-blue text-sm px-3.5 py-3">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <span>You're signed in, but no workspace is linked to this account yet. Create one, or ask your admin to add your email.</span>
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-accent-red/15 text-accent-red text-sm px-3.5 py-3">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2.5 mb-5">
            <SocialButton onClick={() => handleSocial("google")} label="Continue with Google" logo={<GoogleLogo />} />
            <SocialButton onClick={() => handleSocial("github")} label="Continue with GitHub" logo={<GithubLogo />} />
            <SocialButton onClick={() => handleSocial("facebook")} label="Continue with Facebook" logo={<FacebookLogo />} />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-xs text-cream/40">or with email</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required className="input" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              <LogIn size={16} /> {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-cream/50 mt-6 text-center">
            Don't have a workspace yet?{" "}
            <Link to="/create-workspace" className="text-cream font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
