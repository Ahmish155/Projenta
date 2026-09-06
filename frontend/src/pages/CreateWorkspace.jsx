import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { auth, googleProvider, githubProvider, facebookProvider } from "../firebase.js";
import { signInWithPopup } from "firebase/auth";

const roleHome = { admin: "/admin" };

const CreateWorkspace = () => {
  const { signUpWithEmail, createWorkspace } = useAuth();
  const navigate = useNavigate();
  const [workspaceName, setWorkspaceName] = useState("");
  const [form, setForm] = useState({ adminName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requireWorkspaceName = () => {
    if (!workspaceName.trim()) {
      setError("Enter a workspace name first — that's what your team will see.");
      return false;
    }
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!requireWorkspaceName()) return;
    setLoading(true);
    try {
      const fbUser = await signUpWithEmail(form.adminName, form.email, form.password);
      await createWorkspace(fbUser, workspaceName);
      navigate("/admin");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Could not create workspace");
    } finally { setLoading(false); }
  };

  const handleSocial = async (providerName) => {
    setError("");
    if (!requireWorkspaceName()) return;
    setLoading(true);
    try {
      const provider = { google: googleProvider, github: githubProvider, facebook: facebookProvider }[providerName];
      const cred = await signInWithPopup(auth, provider);
      await createWorkspace(cred.user, workspaceName);
      navigate("/admin");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Could not create workspace");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-cream">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-cream text-base-950 flex items-center justify-center font-display font-bold">P</div>
          <span className="font-display font-semibold text-xl">Projenta</span>
        </Link>

        <div className="card p-7">
          <h1 className="font-display text-xl font-bold mb-1">Create your workspace</h1>
          <p className="text-sm text-cream/60 mb-6">You'll become the admin — add your team and start assigning work.</p>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-accent-red/15 text-accent-red text-sm px-3.5 py-3">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-5">
            <label className="label">Workspace name</label>
            <input required className="input" placeholder="Acme Studio" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
          </div>

          <div className="space-y-2.5 mb-5">
            <button type="button" onClick={() => handleSocial("google")} disabled={loading} className="btn-secondary w-full">Continue with Google</button>
            <button type="button" onClick={() => handleSocial("github")} disabled={loading} className="btn-secondary w-full">Continue with GitHub</button>
            <button type="button" onClick={() => handleSocial("facebook")} disabled={loading} className="btn-secondary w-full">Continue with Facebook</button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-xs text-cream/40">or with email</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="label">Your name</label>
              <input required className="input" placeholder="Jane Doe" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required minLength={6} className="input" placeholder="At least 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating..." : "Create workspace"} <ArrowUpRight size={16} />
            </button>
          </form>
        </div>

        <p className="text-sm text-cream/50 mt-6 text-center">
          Already have a workspace?{" "}
          <Link to="/login" className="text-cream font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default CreateWorkspace;
