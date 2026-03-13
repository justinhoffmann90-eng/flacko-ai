"use client";
import { useState, useEffect, useCallback } from "react";

interface Setup {
  id: string;
  name: string;
  type: "buy" | "avoid";
  status: "backlog" | "testing" | "backtested" | "active" | "archived";
  one_liner?: string;
  hypothesis?: string;
  grade?: string;
  win_rate_20d?: number;
  sample_size?: number;
  tickers?: string[];
  forward_returns?: Record<string, number>;
  backtest_stats?: Record<string, any>;
  conditions?: Record<string, any>;
  source?: string;
  notes?: string;
  last_triggered_at?: string;
  promoted_at?: string;
  created_at?: string;
  category_tags?: string[];
}

const TABS = ["active", "testing", "backlog", "archived"] as const;
type Tab = typeof TABS[number];

const BG = "#0a0a0c";
const CARD_BG = "rgba(255,255,255,0.02)";
const CARD_BORDER = "rgba(255,255,255,0.06)";
const TEXT = "#f0f0f0";
const TEXT_DIM = "rgba(255,255,255,0.4)";
const TEXT_DIMMER = "rgba(255,255,255,0.25)";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#eab308";
const BLUE = "#3b82f6";

export function OrbAdminClient() {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const fetchSetups = useCallback(async (status: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orb/pipeline?status=${status}`);
      const data = await res.json();
      setSetups(data.setups || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSetups(activeTab);
  }, [activeTab, fetchSetups]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/orb/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchSetups(activeTab);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this setup permanently?")) return;
    const res = await fetch(`/api/admin/orb/pipeline/${id}`, { method: "DELETE" });
    if (res.ok) fetchSetups(activeTab);
  };

  const handleSaveNotes = async (id: string) => {
    const res = await fetch(`/api/admin/orb/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesValue }),
    });
    if (res.ok) {
      setEditingNotes(null);
      fetchSetups(activeTab);
    }
  };

  const tabCounts = Object.fromEntries(TABS.map((t) => [t, ""]));

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, sans-serif", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Orb Admin</h1>
            <p style={{ color: TEXT_DIM, fontSize: 13, marginTop: 4 }}>Setup lifecycle management — living library of validated trading setups</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Setup
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent",
              color: activeTab === tab ? TEXT : TEXT_DIM,
              border: "none",
              borderRadius: 7,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Setups list */}
      {loading ? (
        <p style={{ color: TEXT_DIM }}>Loading...</p>
      ) : setups.length === 0 ? (
        <p style={{ color: TEXT_DIM }}>No setups in {activeTab}.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {setups.map((setup) => {
            const isExpanded = expandedId === setup.id;
            const typeColor = setup.type === "buy" ? GREEN : RED;
            return (
              <div
                key={setup.id}
                style={{
                  background: isExpanded ? "rgba(255,255,255,0.04)" : CARD_BG,
                  border: `1px solid ${isExpanded ? "rgba(255,255,255,0.12)" : CARD_BORDER}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
              >
                {/* Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : setup.id)}
                  style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
                >
                  {/* Type badge */}
                  <span style={{ background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}44`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", flexShrink: 0 }}>
                    {setup.type.toUpperCase()}
                  </span>

                  {/* Name + one-liner */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{setup.name}</div>
                    {setup.one_liner && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{setup.one_liner}</div>}
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                    {setup.grade && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: AMBER }}>{setup.grade}</span>
                    )}
                    {setup.win_rate_20d != null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: GREEN }}>{(setup.win_rate_20d * 100).toFixed(0)}%</div>
                        <div style={{ fontSize: 10, color: TEXT_DIMMER, fontFamily: "'JetBrains Mono', monospace" }}>20D WIN {setup.sample_size ? `n=${setup.sample_size}` : ""}</div>
                      </div>
                    )}
                    {setup.tickers && (
                      <div style={{ display: "flex", gap: 4 }}>
                        {setup.tickers.map((t) => (
                          <span key={t} style={{ background: "rgba(255,255,255,0.06)", color: TEXT_DIM, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {/* Chevron */}
                    <span style={{ color: TEXT_DIMMER, fontSize: 16, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Hypothesis */}
                    {setup.hypothesis && (
                      <div>
                        <div style={{ fontSize: 11, color: TEXT_DIMMER, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 6 }}>HYPOTHESIS</div>
                        <p style={{ fontSize: 13, color: TEXT_DIM, lineHeight: 1.6, margin: 0 }}>{setup.hypothesis}</p>
                      </div>
                    )}

                    {/* Forward returns table */}
                    {setup.forward_returns && (
                      <div>
                        <div style={{ fontSize: 11, color: TEXT_DIMMER, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 8 }}>FORWARD RETURNS (AVG)</div>
                        <div style={{ display: "flex", gap: 12 }}>
                          {Object.entries(setup.forward_returns).map(([period, ret]) => (
                            <div key={period} style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px" }}>
                              <div style={{ fontSize: 10, color: TEXT_DIMMER, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{period.toUpperCase()}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: ret >= 0 ? GREEN : RED }}>{ret >= 0 ? "+" : ""}{ret.toFixed(1)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <div style={{ fontSize: 11, color: TEXT_DIMMER, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 6 }}>NOTES</div>
                      {editingNotes === setup.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CARD_BORDER}`, borderRadius: 6, color: TEXT, padding: 10, fontSize: 13, resize: "vertical", minHeight: 80, fontFamily: "Inter, sans-serif" }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => handleSaveNotes(setup.id)} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, cursor: "pointer" }}>Save</button>
                            <button onClick={() => setEditingNotes(null)} style={{ background: "rgba(255,255,255,0.06)", color: TEXT_DIM, border: "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <p style={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.5, margin: 0, flex: 1 }}>{setup.notes || "No notes."}</p>
                          <button onClick={() => { setEditingNotes(setup.id); setNotesValue(setup.notes || ""); }} style={{ background: "rgba(255,255,255,0.06)", color: TEXT_DIM, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>Edit</button>
                        </div>
                      )}
                    </div>

                    {/* Source + dates */}
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: TEXT_DIMMER, fontFamily: "'JetBrains Mono', monospace" }}>
                      {setup.source && <span>SOURCE: {setup.source}</span>}
                      {setup.last_triggered_at && <span>LAST TRIGGERED: {new Date(setup.last_triggered_at).toLocaleDateString()}</span>}
                      {setup.promoted_at && <span>PROMOTED: {new Date(setup.promoted_at).toLocaleDateString()}</span>}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 12 }}>
                      {activeTab === "backlog" && (
                        <button onClick={() => handleStatusChange(setup.id, "testing")} style={{ background: AMBER + "33", color: AMBER, border: `1px solid ${AMBER}44`, borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>→ Testing</button>
                      )}
                      {activeTab === "testing" && (
                        <button onClick={() => handleStatusChange(setup.id, "active")} style={{ background: GREEN + "33", color: GREEN, border: `1px solid ${GREEN}44`, borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>→ Promote to Active</button>
                      )}
                      {activeTab === "active" && (
                        <button onClick={() => handleStatusChange(setup.id, "archived")} style={{ background: "rgba(255,255,255,0.06)", color: TEXT_DIM, border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Archive</button>
                      )}
                      {activeTab !== "active" && (
                        <>
                          <button onClick={() => handleStatusChange(setup.id, "archived")} style={{ background: "rgba(255,255,255,0.06)", color: TEXT_DIM, border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Archive</button>
                          <button onClick={() => handleDelete(setup.id)} style={{ background: RED + "22", color: RED, border: `1px solid ${RED}44`, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Setup Modal */}
      {showAddModal && <AddSetupModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchSetups(activeTab); }} />}
    </div>
  );
}

function AddSetupModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: "", hypothesis: "", type: "buy", tickers: "TSLA", source: "manual", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const res = await fetch("/api/admin/orb/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id, tickers: form.tickers.split(",").map((t) => t.trim().toUpperCase()), status: "backlog" }),
    });
    setSaving(false);
    if (res.ok) onAdded();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: "90%", maxWidth: 560 }}>
        <h2 style={{ color: "#f0f0f0", fontWeight: 800, fontSize: 20, marginTop: 0, marginBottom: 24 }}>Add New Setup</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Name", key: "name", placeholder: "e.g. RSI Oversold Recovery" },
            { label: "Tickers (comma-separated)", key: "tickers", placeholder: "TSLA, QQQ" },
            { label: "Source", key: "source", placeholder: "manual / nightly-cron / justin" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace", display: "block", marginBottom: 4 }}>{label.toUpperCase()}</label>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required={key === "name"}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#f0f0f0", padding: "9px 12px", fontSize: 13, fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace", display: "block", marginBottom: 4 }}>TYPE</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#f0f0f0", padding: "9px 12px", fontSize: 13, width: "100%" }}>
              <option value="buy">Buy</option>
              <option value="avoid">Avoid</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace", display: "block", marginBottom: 4 }}>HYPOTHESIS</label>
            <textarea value={form.hypothesis} onChange={(e) => setForm((f) => ({ ...f, hypothesis: e.target.value }))} placeholder="What is the setup based on? Why should it work?" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#f0f0f0", padding: "9px 12px", fontSize: 13, fontFamily: "Inter, sans-serif", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace", display: "block", marginBottom: 4 }}>NOTES</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional context..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#f0f0f0", padding: "9px 12px", fontSize: 13, fontFamily: "Inter, sans-serif", resize: "vertical", minHeight: 60, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : "Add to Backlog"}</button>
            <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
