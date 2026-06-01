import { useEffect, useState } from "react";
import { Activity, Archive, GitBranch, Lock, LogOut, ArrowLeft } from "lucide-react";
import { approveCheckpoint, createRun, getCurrentCheckpoint, listDigests, listRuns } from "./api";
import { Checkpoint } from "./pages/Checkpoint";
import { Dashboard } from "./pages/Dashboard";
import { Digest } from "./pages/Digest";
import { PublicSite } from "./pages/PublicSite";
import type { Checkpoint as CheckpointType, Digest as DigestType, RunState } from "./types";

type AdminTab = "dashboard" | "checkpoint" | "digests";

export function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem("techpulse_admin") === "true";
  });
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [runs, setRuns] = useState<RunState[]>([]);
  const [checkpoint, setCheckpoint] = useState<CheckpointType | null>(null);
  const [digests, setDigests] = useState<DigestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  async function refresh() {
    setError(null);
    try {
      const [runsResult, checkpointResult, digestResult] = await Promise.all([
        listRuns(),
        getCurrentCheckpoint(),
        listDigests(),
      ]);
      setRuns(runsResult.runs);
      setCheckpoint(checkpointResult.checkpoint);
      setDigests(digestResult.digests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend unavailable");
    }
  }

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const result = await createRun();
      setCheckpoint(result.checkpoint);
      setAdminTab("checkpoint");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start run");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(selectedItemIds?: string[]) {
    if (!checkpoint) return;
    setApproving(true);
    setError(null);
    try {
      const result = await approveCheckpoint(checkpoint.id, selectedItemIds);
      setCheckpoint(result.checkpoint);
      if (!result.checkpoint) {
        setAdminTab("digests");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to approve checkpoint");
    } finally {
      setApproving(false);
    }
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Backend unavailable"));
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
    if (passcode === correctPassword) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem("techpulse_admin", "true");
      setLoginError(null);
      setPasscode("");
    } else {
      setLoginError("Invalid admin passcode");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem("techpulse_admin");
    window.location.hash = "#/";
  };

  const isAdminRoute = currentHash.startsWith("#/admin") || currentHash.startsWith("#admin");

  if (!isAdminRoute) {
    // PUBLIC VIEW (No sidebar, full width)
    return (
      <main className="public-portal-layout">
        <PublicSite digests={digests} />
      </main>
    );
  }

  if (!isAdminAuthenticated) {
    // ADMIN LOGIN VIEW
    return (
      <main className="admin-login-layout">
        <form className="admin-login-card" onSubmit={handleAdminLogin}>
          <div className="login-header">
            <Lock className="lock-icon" size={32} />
            <h2>Ops Console</h2>
            <p>Enter passcode to access TechPulse admin panel</p>
          </div>
          {loginError && <div className="error-message">{loginError}</div>}
          <div className="input-group">
            <input
              type="password"
              placeholder="Admin passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="primary-button full-width">
            Access Dashboard
          </button>
          <button type="button" className="secondary-button full-width text-center" onClick={() => window.location.hash = "#/"}>
            <ArrowLeft size={16} /> Back to Public Site
          </button>
        </form>
      </main>
    );
  }

  // ADMIN DASHBOARD VIEW
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Activity size={26} />
          <div>
            <h1>TechPulse</h1>
            <p>Agent digest console</p>
          </div>
        </div>
        <nav>
          <button className={adminTab === "dashboard" ? "active" : ""} onClick={() => setAdminTab("dashboard")}>
            <GitBranch size={18} />
            Dashboard
          </button>
          <button className={adminTab === "checkpoint" ? "active" : ""} onClick={() => setAdminTab("checkpoint")}>
            <Activity size={18} />
            Checkpoints
          </button>
          <button className={adminTab === "digests" ? "active" : ""} onClick={() => setAdminTab("digests")}>
            <Archive size={18} />
            Digests
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleAdminLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Weekly intelligence pipeline</p>
            <h2>
              {adminTab === "dashboard"
                ? "Dashboard"
                : adminTab === "checkpoint"
                  ? "Approval Queue"
                  : "Digest Archive"}
            </h2>
          </div>
          {checkpoint ? (
            <span className="attention">Approval waiting</span>
          ) : (
            <span className="quiet">No pending approval</span>
          )}
        </header>

        {error ? <div className="error">{error}</div> : null}

        {adminTab === "dashboard" ? (
          <Dashboard
            runs={runs}
            loading={loading}
            onRun={handleRun}
            onRefresh={() => refresh().catch(console.error)}
          />
        ) : null}
        {adminTab === "checkpoint" ? (
          <Checkpoint checkpoint={checkpoint} approving={approving} onApprove={handleApprove} />
        ) : null}
        {adminTab === "digests" ? <Digest digests={digests} /> : null}
      </section>
    </main>
  );
}
