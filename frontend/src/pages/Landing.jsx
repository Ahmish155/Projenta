import React from "react";
import { Link } from "react-router-dom";
import { Search, ArrowUpRight, Sparkles, Users, ListChecks, MessageSquare } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen text-cream">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        {/* Nav */}
        <header className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-cream text-base-900 flex items-center justify-center font-display font-bold text-sm">
              P
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">Projenta</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-cream/70">
            <a href="#features" className="hover:text-cream transition-colors">Features</a>
            <a href="#how" className="hover:text-cream transition-colors">How it works</a>
            <a href="#" className="hover:text-cream transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Search size={17} className="text-cream/50 hidden sm:block" />
            <Link to="/login" className="btn-secondary !py-2 !px-4 text-sm">Sign in</Link>
          </div>
        </header>

        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-10 items-center pt-10 pb-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-3.5 py-1.5 text-xs text-cream/80 mb-6">
              <Sparkles size={13} /> Built for teams that ship
            </span>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-[1.1] mb-5">
              Run your team's work in one calm, connected workspace
            </h1>
            <p className="text-cream/60 text-base leading-relaxed mb-8 max-w-md">
              Create a workspace, build your teams, assign tasks down the chain of
              command, and chat about it all in real time — without switching between
              five different tools.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/create-workspace" className="btn-primary">
                Create your workspace <ArrowUpRight size={16} />
              </Link>
              <Link to="/login" className="btn-secondary">Sign in to existing workspace</Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-accent-amber/10 rounded-[2rem] blur-3xl" />
            <div className="relative card p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Acme Studio · Overview</p>
                <span className="pill-inprogress">Live</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[["Active users", "12"], ["Teams", "3"], ["Tasks done", "48"]].map(([l, v]) => (
                  <div key={l} className="bg-white/[0.04] rounded-xl p-3.5">
                    <p className="text-xl font-display font-bold">{v}</p>
                    <p className="text-[11px] text-muted mt-1">{l}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  ["Design new onboarding flow", "In Progress", "text-accent-amber"],
                  ["QA pass on billing module", "Pending", "text-muted"],
                  ["Ship v2.3 release notes", "Completed", "text-accent-green"],
                ].map(([t, s, c]) => (
                  <div key={t} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3.5 py-2.5">
                    <span className="text-sm">{t}</span>
                    <span className={`text-xs font-semibold ${c}`}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="grid md:grid-cols-3 gap-5 pb-24">
          {[
            { icon: Users, title: "Workspaces & teams", desc: "Spin up a workspace, build teams, and appoint team leads who manage their own people." },
            { icon: ListChecks, title: "Task chain of command", desc: "Admins assign to team leads, leads assign to members — everyone sees exactly what's theirs, with time tracked automatically." },
            { icon: MessageSquare, title: "Built-in conversation", desc: "Group chat, calls, and file sharing live right next to the work, so context never gets lost." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-display font-semibold mb-2">{title}</h3>
              <p className="text-sm text-cream/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Landing;
