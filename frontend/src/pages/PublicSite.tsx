import { ArrowLeft, Bell, BookOpen, ExternalLink, LogIn, Mail, Sparkles, Activity, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loginSubscriber, subscribe } from "../api";
import { ScoreBadge } from "../components/ScoreBadge";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { Digest, Item, Subscriber } from "../types";

type Props = {
  digests: Digest[];
};

const TOPICS = ["AI Agents", "DevTools", "Open Source", "Infrastructure", "Research", "Startups"];

export function PublicSite({ digests }: Props) {
  const [selectedDigest, setSelectedDigest] = useState<Digest | null>(digests[0] ?? null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const frequency = "weekly";
  const [topics, setTopics] = useState<string[]>(["AI Agents", "DevTools", "Open Source"]);
  const [subscriber, setSubscriber] = useState<Subscriber | null>(() => {
    const raw = localStorage.getItem("techpulse_subscriber");
    return raw ? (JSON.parse(raw) as Subscriber) : null;
  });
  const [status, setStatus] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"subscribe" | "login">("subscribe");
  const [showPreferences, setShowPreferences] = useState(false);

  const latestDigest = useMemo(() => selectedDigest ?? digests[0] ?? null, [digests, selectedDigest]);

  useEffect(() => {
    if (subscriber) {
      setEmail(subscriber.email);
      setName(subscriber.name || "");
      setTopics(subscriber.topics);
    } else {
      setEmail("");
      setName("");
      setTopics(["AI Agents", "DevTools", "Open Source"]);
    }
  }, [subscriber]);

  function toggleTopic(topic: string) {
    setTopics((current) => (current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]));
  }

  async function handleSubscribe() {
    setStatus(null);
    try {
      if (isSupabaseConfigured && supabase) {
        if (password.length < 6) {
          setStatus("Use a password with at least 6 characters.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              topics,
              frequency,
            },
          },
        });
        if (error) {
          setStatus(error.message);
          return;
        }
      }
      const result = await subscribe({ email, name, frequency, topics });
      localStorage.setItem("techpulse_token", result.token);
      localStorage.setItem("techpulse_subscriber", JSON.stringify(result.subscriber));
      setSubscriber(result.subscriber);
      setStatus("Subscription saved successfully!");
      setShowPreferences(false);
    } catch (err) {
      let msg = "Subscription failed";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.detail) {
            msg = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
          } else {
            msg = err.message;
          }
        } catch {
          msg = err.message;
        }
      }
      setStatus(msg);
    }
  }

  async function handleLogin() {
    setStatus(null);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setStatus(error.message);
          return;
        }
      }
      const result = await loginSubscriber(email);
      localStorage.setItem("techpulse_token", result.token);
      localStorage.setItem("techpulse_subscriber", JSON.stringify(result.subscriber));
      setSubscriber(result.subscriber);
      setTopics(result.subscriber.topics);
      setName(result.subscriber.name || "");
      setStatus("Signed in to subscriber view.");
      setShowPreferences(false);
    } catch (err) {
      let msg = "Sign-in failed";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.detail) {
            if (parsed.detail === "Subscriber not found") {
              msg = "We couldn't find a subscription with that email. Please check your spelling or sign up instead!";
            } else {
              msg = parsed.detail;
            }
          } else {
            msg = err.message;
          }
        } catch {
          msg = err.message;
        }
      }
      setStatus(msg);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("techpulse_token");
    localStorage.removeItem("techpulse_subscriber");
    setSubscriber(null);
    setStatus("Logged out.");
  };

  return (
    <div className="public-portal">
      {/* Navigation Header */}
      <header className="public-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <Activity className="brand-logo" size={24} />
            <span className="brand-name">TechPulse</span>
            <span className="brand-tag">Digest</span>
          </div>
          <div className="navbar-links">
            <a href="#/" onClick={() => { setSelectedDigest(digests[0] ?? null); setSelectedItem(null); }}>Latest</a>
            {digests.length > 1 && <a href="#archive-section">Archive ({digests.length})</a>}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="public-hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Autonomous Intelligence & Curation</span>
          </div>
          <h1 className="hero-title">
            The Tech Digest, <span className="text-glow">Curated by Agents.</span> Approved by Humans.
          </h1>
          <p className="hero-subtitle">
            We scan research papers, dev blogs, and developer signals. Our multi-agent pipeline filters and ranks them for relevance, and writes structured digests. You get the signal, clean and verified.
          </p>

          {/* Subscriptions Card / Form */}
          <div className="hero-form-card">
            {subscriber ? (
              <div className="subscribed-state">
                <div className="subscribed-header">
                  <div className="check-indicator">✓</div>
                  <div>
                    <h3>You're subscribed as {subscriber.name || "Subscriber"}</h3>
                    <p className="quiet-text">{subscriber.email}</p>
                  </div>
                </div>
                <div className="subscribed-details">
                  <p><strong>Topics:</strong> {subscriber.topics.join(", ") || "General"}</p>
                  <div className="subscribed-actions">
                    <button className="text-btn" onClick={() => setShowPreferences(!showPreferences)}>
                      {showPreferences ? "Close settings" : "Edit preferences"}
                    </button>
                    <button className="text-btn danger" onClick={handleLogout}>Sign Out</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-form-fields">
                <div className="form-row">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="topic-selection-section">
                  <p className="section-label">Select topics of interest:</p>
                  <div className="topics-pill-grid">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={`topic-pill ${topics.includes(topic) ? "selected" : ""}`}
                        onClick={() => toggleTopic(topic)}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="primary-button submit-btn"
                  onClick={handleSubscribe}
                  disabled={!email}
                >
                  <Mail size={16} />
                  Join Newsletter
                </button>
              </div>
            )}

            {showPreferences && subscriber && (
              <div className="auth-form-fields preferences-edit">
                <div className="topic-selection-section">
                  <p className="section-label">Edit topics of interest:</p>
                  <div className="topics-pill-grid">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={`topic-pill ${topics.includes(topic) ? "selected" : ""}`}
                        onClick={() => toggleTopic(topic)}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="primary-button submit-btn" onClick={handleSubscribe}>
                  Save Preferences
                </button>
              </div>
            )}

            {status && <div className="status-banner">{status}</div>}
          </div>
        </div>
      </section>

      {/* Main Digest Area */}
      <section className="public-digest-section">
        {latestDigest ? (
          <div className="digest-container">
            <div className="digest-header-card">
              <p className="eyebrow">Latest Edition</p>
              <h2>{latestDigest.title}</h2>
              <p className="digest-intro-text">{latestDigest.intro}</p>
              <div className="digest-meta">
                <span className="meta-tag">{latestDigest.items.length} stories compiled</span>
                <span className="meta-tag">{new Date(latestDigest.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="stories-grid">
              {latestDigest.items.map((item, index) => (
                <article className="story-card" key={item.id}>
                  <div className="story-header">
                    <span className="story-index">#{(index + 1).toString().padStart(2, '0')}</span>
                    <span className="story-source">{item.source}</span>
                  </div>
                  <h3 className="story-title">{item.title}</h3>
                  <p className="story-summary-snippet">
                    {item.summary.length > 180 ? `${item.summary.substring(0, 175)}...` : item.summary}
                  </p>
                  <div className="story-footer">
                    <div className="story-tags">
                      {item.category && <span className="category-tag">{item.category}</span>}
                    </div>
                    <button className="story-read-btn" onClick={() => setSelectedItem(item)}>
                      <span>Read Story</span>
                      <BookOpen size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-digest-state">
            <BookOpen size={48} className="empty-icon" />
            <h3>No Published Newsletter</h3>
            <p>Go to the Admin Console to trigger a weekly run and publish the first edition.</p>
            <a href="#/admin" className="primary-button">Open Ops Console</a>
          </div>
        )}
      </section>

      {/* Archives Section */}
      {digests.length > 1 && (
        <section id="archive-section" className="public-archive-section">
          <div className="archive-container">
            <h2 className="section-title">Past Editions</h2>
            <div className="archive-list">
              {digests.map((digest) => (
                <button
                  className={`archive-row ${selectedDigest?.id === digest.id ? "active" : ""}`}
                  key={digest.id}
                  onClick={() => {
                    setSelectedDigest(digest);
                    setSelectedItem(null);
                    const rect = document.querySelector('.public-digest-section')?.getBoundingClientRect();
                    if (rect) {
                      window.scrollTo({ top: rect.top + window.scrollY - 100, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className="archive-row-info">
                    <h4>{digest.title}</h4>
                    <p>{digest.intro.substring(0, 100)}...</p>
                  </div>
                  <div className="archive-row-meta">
                    <span>{new Date(digest.created_at).toLocaleDateString()}</span>
                    <span className="pill-badge">{digest.items.length} items</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} TechPulse. All rights reserved.</p>
          <p className="quiet-text">Built with React, FastAPI, Supabase & LangGraph workflows.</p>
        </div>
      </footer>

      {/* Article Detail Drawer / Modal Overlay */}
      {selectedItem && latestDigest && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedItem(null)} aria-label="Close">
              <X size={20} />
            </button>
            <div className="modal-body">
              <div className="modal-meta-header">
                <span className="source-badge">{selectedItem.source}</span>
                {selectedItem.author && <span className="author-name">By {selectedItem.author}</span>}
              </div>
              <h2 className="modal-title">{selectedItem.title}</h2>
              <div className="modal-tag-row">
                {selectedItem.category && <span className="category-pill">{selectedItem.category}</span>}
                {selectedItem.stack_tags.map(tag => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
              
              <div className="modal-divider"></div>
              
              <div className="modal-summary-content">
                <h3>Executive Summary</h3>
                <p>{selectedItem.summary}</p>
                
                <div className="modal-info-alert">
                  <Sparkles size={16} className="alert-icon" />
                  <p>
                    This insight was compiled in the <strong>{latestDigest.title}</strong> edition. 
                    Our autonomous relevance scoring ranked this story with a 
                    Relevance Score of <strong>{(selectedItem.relevance_score * 100).toFixed(0)}%</strong> and a 
                    Novelty Score of <strong>{(selectedItem.novelty_score * 100).toFixed(0)}%</strong>.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <a className="primary-button external-source-btn" href={selectedItem.url} target="_blank" rel="noreferrer">
                  <span>Explore Original Source</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
