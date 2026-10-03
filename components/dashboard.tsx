"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { contributionDifference } from "@/lib/calculations";
import { inr } from "@/lib/demo-data";
import { PortfolioChart } from "@/components/portfolio-chart";

type Mode = "pause" | "reduce";
type DashboardProps = {
  user: { name: string | null; email: string | null; image: string | null };
  sip: {
    id: string; fundName: string; category: string; monthlyAmount: number; nextDate: string;
    goal: { name: string; current: number; target: number; targetYear: number; yearsRemaining: number } | null;
  } | null;
  activeSipCount: number;
  riskProfile: string;
  portfolio: { invested: number; value: number; equityPercent: number; debtPercent: number; otherPercent: number } | null;
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
    arrow: <><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    close: <><path d="m18 6-12 12"/><path d="m6 6 12 12"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    wallet: <><path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 14h.01"/></>,
  };
  return <svg {...common} aria-hidden="true">{paths[name]}</svg>;
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} /></div>;
}

export function Dashboard({ user, sip, activeSipCount, riskProfile, portfolio }: DashboardProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [modal, setModal] = useState(false);
  const [showSipForm, setShowSipForm] = useState(false);
  const [creatingSip, setCreatingSip] = useState(false);
  const [sipFormError, setSipFormError] = useState("");
  const [mode, setMode] = useState<Mode>("pause");
  const [months, setMonths] = useState(3);
  const [reducedAmount, setReducedAmount] = useState(5000);
  const [confirmed, setConfirmed] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [explanation, setExplanation] = useState<{ headline: string; explanation: string; considerations: string[]; model: string; modelName?: string; reasonCode?: string } | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const syncViewport = (mobile: boolean) => {
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    syncViewport(mobileQuery.matches);
    const handleViewportChange = (event: MediaQueryListEvent) => syncViewport(event.matches);
    mobileQuery.addEventListener("change", handleViewportChange);
    return () => mobileQuery.removeEventListener("change", handleViewportChange);
  }, []);

  const sidebarExpanded = sidebarOpen ?? !isMobile;
  const newAmount = mode === "reduce" ? reducedAmount : 0;
  const currentSipAmount = sip?.monthlyAmount ?? 0;
  const goal = sip?.goal;
  const maximumReducedAmount = Math.max(500, currentSipAmount - 500);
  const profileName = user.name || user.email || "Investor";
  const initials = profileName.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "U";
  const allocationTotal = portfolio ? portfolio.equityPercent + portfolio.debtPercent + portfolio.otherPercent : 0;
  const impact = useMemo(() => contributionDifference(currentSipAmount, months, newAmount), [currentSipAmount, months, newAmount]);

  function openCopilot(nextMode: Mode) {
    if (!sip) return;
    setMode(nextMode);
    if (nextMode === "reduce") setReducedAmount(Math.max(500, currentSipAmount - 500));
    setConfirmed("");
    setExplanation(null);
    setContextError("");
    setModal(true);
  }

  useEffect(() => {
    if (!modal) return;
    let cancelled = false;
    const action = mode === "pause" ? "PAUSE" : "REDUCE";
    setContextLoading(true);
    setContextError("");
    setExplanation(null);
    void (async () => {
      try {
        const contextResponse = await fetch("/api/decision-context", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sipId: sip?.id, action, durationMonths: months, proposedAmount: mode === "pause" ? 0 : reducedAmount }),
        });
        if (!contextResponse.ok) throw new Error("We couldn’t load the decision context. Please try again.");
        const payload = await contextResponse.json();
        const context = payload.context;
        const aiResponse = await fetch("/api/copilot/intervene", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: {
            action, durationMonths: months,
            monthlyAmount: Number(context.sip.monthlyAmount),
            proposedAmount: Number(context.proposal.proposedAmount),
            contributionDifference: Number(context.impact.totalDifference),
            goalName: context.goal?.name ?? context.sip.goalName ?? "your investment plan",
            yearsRemaining: Number(context.goal?.yearsRemaining ?? 0),
            marketLabel: context.market.label,
            marketSummary: context.market.summary,
          } }),
        });
        if (!aiResponse.ok) throw new Error("The explanation is temporarily unavailable.");
        const aiPayload = await aiResponse.json();
        if (!cancelled) setExplanation(aiPayload.explanation);
      } catch (error) {
        if (!cancelled) setContextError(error instanceof Error ? error.message : "Decision context unavailable.");
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [modal, mode, months, reducedAmount, sip?.id]);

  async function finalize() {
    setSaving(true);
    setContextError("");
    try {
      const response = await fetch("/api/sip/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sipId: sip?.id, action: mode === "pause" ? "PAUSE" : "REDUCE", durationMonths: months, proposedAmount: mode === "pause" ? 0 : reducedAmount }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save the demo choice.");
      setConfirmed(payload.message);
      setModal(false);
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Could not save the demo choice.");
    } finally {
      setSaving(false);
    }
  }

  async function createSip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setCreatingSip(true);
    setSipFormError("");
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/sip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundName: String(formData.get("fundName") ?? ""),
          category: String(formData.get("category") ?? ""),
          monthlyAmount: Number(formData.get("monthlyAmount")),
          nextDate: String(formData.get("nextDate") ?? "") || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save this SIP.");
      setShowSipForm(false);
      form.reset();
      router.refresh();
    } catch (error) {
      setSipFormError(error instanceof Error ? error.message : "Could not save this SIP.");
    } finally {
      setCreatingSip(false);
    }
  }

  return (
    <main className={`app-shell ${sidebarOpen === null ? "sidebar-auto" : sidebarExpanded ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="sidebar" aria-hidden={!sidebarExpanded}>
        <a className="brand" href="#home" aria-label="SIP Compass home" onClick={() => isMobile && setSidebarOpen(false)}><span className="brand-mark"><Icon name="target" size={22}/></span><span>SIP<span className="brand-light">Compass</span></span></a>
        <div className="workspace-label">YOUR MONEY</div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item" href="#overview" onClick={() => isMobile && setSidebarOpen(false)}><Icon name="grid"/>Overview</a>
          <a className="nav-item" href="#portfolio" onClick={() => isMobile && setSidebarOpen(false)}><Icon name="chart"/>Portfolio</a>
          <a className="nav-item" href="#goals" onClick={() => isMobile && setSidebarOpen(false)}><Icon name="target"/>Goals</a>
          <a className="nav-item active" href="#sip" onClick={() => isMobile && setSidebarOpen(false)}><Icon name="repeat"/>SIPs<span className="nav-count">{activeSipCount}</span></a>
        </nav>
        <div className="sidebar-spacer"/>
        <div className="sidebar-note"><div className="note-icon"><Icon name="shield" size={18}/></div><p>Your choices stay yours.</p><span>We’re here to help you see the full picture.</span></div>
        <button className="profile" onClick={() => void signOut({ redirectTo: "/login" })} aria-label="Sign out"><span className="avatar">{initials}</span><span className="profile-copy"><strong>{profileName}</strong><small>Sign out</small></span><span className="profile-dots">↗</span></button>
      </aside>

      <section className="main-area" id="home">
        <header className="topbar"><div className="topbar-left"><button className="sidebar-toggle" aria-label={sidebarExpanded ? "Close sidebar" : "Open sidebar"} aria-expanded={sidebarExpanded} onClick={() => setSidebarOpen(!sidebarExpanded)}><Icon name={sidebarExpanded ? "close" : "menu"} size={20}/></button><div className="breadcrumbs">Your money <span>/</span> <strong>SIPs</strong></div></div><div className="topbar-right"><span className="demo-tag"><span/> PRIVATE ACCOUNT</span><span className="top-avatar">{initials}</span></div></header>
        <div className="content-wrap">
          <div className="page-intro"><div><div className="eyebrow">MONDAY, 5 OCTOBER 2026</div><h1>Your SIPs</h1><p className="page-subtitle">Small, steady steps toward what matters to you.</p></div><button className="text-button" onClick={() => setShowBreakdown(!showBreakdown)}><Icon name="info" size={17}/> How SIPs work</button></div>
          {showBreakdown && <div className="inline-explainer"><strong>A systematic investment plan (SIP)</strong> invests a chosen amount at regular intervals. Your investments can rise or fall in value; past performance does not predict future results.</div>}
          {confirmed && <div className="success-banner"><span className="success-check"><Icon name="check" size={16}/></span><div><strong>Choice saved for review</strong><span>{confirmed}. No real investment instruction was sent.</span></div><button aria-label="Dismiss" onClick={() => setConfirmed("")}><Icon name="close" size={17}/></button></div>}
          {showSipForm && <form className="sip-entry-form" onSubmit={createSip}>
            <div className="sip-entry-heading"><div><h2>Add an active SIP</h2><p>Enter the details shown in your fund statement.</p></div><button type="button" className="text-button" onClick={() => { setShowSipForm(false); setSipFormError(""); }}>Cancel</button></div>
            <div className="sip-entry-fields">
              <label>Fund name<input name="fundName" required minLength={2} maxLength={120} placeholder="e.g. Your mutual fund name" /></label>
              <label>Category<input name="category" required minLength={2} maxLength={100} placeholder="e.g. Equity · Large cap" /></label>
              <label>Monthly SIP amount (₹)<input name="monthlyAmount" type="number" required min="1" max="100000000" step="1" placeholder="5000" /></label>
              <label>Next installment date <span>(optional)</span><input name="nextDate" type="date" /></label>
            </div>
            <p className="sip-entry-note">This is a manual record for decision support. It won’t change your SIP with the fund provider.</p>
            {sipFormError && <div className="api-error" role="alert">{sipFormError}</div>}
            <button className="button-pause" type="submit" disabled={creatingSip}>{creatingSip ? "Saving SIP…" : "Save SIP to my account"}</button>
          </form>}

          {!sip ? <section className="account-empty"><span className="summary-icon green"><Icon name="repeat" size={18}/></span><h2>No active SIPs found</h2><p>There are no active SIP plans linked to this signed-in account yet. Add your details manually to review pause or reduction choices.</p><button className="button-pause" onClick={() => setShowSipForm(true)}>Add an active SIP</button></section> : <>
          <div className="summary-grid" id="overview">
            <div className="summary-card"><div className="summary-top"><span>Portfolio invested</span><span className="summary-icon purple"><Icon name="wallet" size={17}/></span></div><strong>{inr(portfolio?.invested ?? 0)}</strong><small>{portfolio ? "Across your portfolio" : "Portfolio data not connected"}</small></div>
            <div className="summary-card"><div className="summary-top"><span>Monthly SIPs</span><span className="summary-icon green"><Icon name="repeat" size={17}/></span></div><strong>{inr(currentSipAmount)}<em>/mo</em></strong><small>{activeSipCount} active {activeSipCount === 1 ? "plan" : "plans"}</small></div>
            <div className="summary-card"><div className="summary-top"><span>Linked goal</span><span className="summary-icon peach"><Icon name="target" size={17}/></span></div><strong>{goal ? "1" : "0"}</strong><small>{goal ? "This SIP is goal-linked" : "No goal linked to this SIP"}</small></div>
          </div>

          <div className="section-heading" id="sip"><div><h2>Your active SIPs</h2><p>Choose a plan to see its details.</p></div><button className="quiet-button" onClick={() => setShowSipForm(true)}>Add SIP <Icon name="chevron" size={15}/></button></div>

          <article className="sip-card">
            <div className="sip-card-top"><div className="fund-identity"><div className="fund-logo">{sip.fundName.slice(0, 1)}</div><div><div className="fund-title-row"><h3>{sip.fundName}</h3><span className="status-pill"><i/> Active</span></div><span className="fund-category">{sip.category}</span></div></div></div>
            <div className="sip-metrics"><div><span className="metric-label">Monthly investment</span><strong>{inr(currentSipAmount)}<small>/ month</small></strong></div><div><span className="metric-label">Portfolio value</span><strong>{portfolio ? inr(portfolio.value) : "Unavailable"}</strong></div><div><span className="metric-label">Active plans</span><strong>{activeSipCount}</strong></div><div><span className="metric-label">Next installment</span><strong>{sip.nextDate}</strong></div></div>
            <div className="sip-goal-row"><span className="goal-icon"><Icon name="target" size={17}/></span><span>{goal ? <>Linked to <strong>{goal.name}</strong></> : "No goal linked to this SIP"}</span><span className="goal-spacer"/></div>
            <div className="sip-actions"><span>Thinking of changing this SIP?</span><div><button className="button-secondary" onClick={() => openCopilot("reduce")} disabled={currentSipAmount <= 500} title={currentSipAmount <= 500 ? "This SIP is already at the minimum reduction amount." : undefined}>Reduce amount</button><button className="button-pause" onClick={() => openCopilot("pause")}>Pause SIP <Icon name="chevron" size={16}/></button></div></div>
          </article>

          <div className="lower-grid">
            <article className="goal-card" id="goals"><div className="card-overline"><span className="goal-icon"><Icon name="target" size={17}/></span><span>LINKED GOAL</span></div>{goal ? <><h3>{goal.name}</h3><p>Target by {goal.targetYear}</p><div className="goal-amounts"><strong>{inr(goal.current)}</strong><span>of {inr(goal.target)}</span></div><ProgressBar value={goal.target ? goal.current / goal.target * 100 : 0}/><div className="goal-foot"><span>{goal.target ? Math.round(goal.current / goal.target * 100) : 0}% funded</span><span>{goal.yearsRemaining} years to go</span></div><div className="goal-tip"><Icon name="spark" size={16}/><span>Contribution changes may affect your goal timeline.</span></div></> : <p className="empty-card-copy">No goal is linked to this SIP.</p>}</article>
          <article className="context-card" id="portfolio"><div className="context-heading"><span className="context-icon"><Icon name="chart" size={17}/></span><div><h3>Your portfolio snapshot</h3><p>{portfolio ? `Current value ${inr(portfolio.value)}` : "Portfolio data has not been connected"}</p></div></div>{portfolio && allocationTotal > 0 ? <div className="allocation-row"><PortfolioChart equity={portfolio.equityPercent} debt={portfolio.debtPercent} other={portfolio.otherPercent}/><div className="allocation-legend"><span><i className="legend-equity"/> Equity <strong>{portfolio.equityPercent}%</strong></span><span><i className="legend-debt"/> Debt <strong>{portfolio.debtPercent}%</strong></span><span><i className="legend-other"/> Other <strong>{portfolio.otherPercent}%</strong></span></div></div> : <p className="empty-card-copy">Add portfolio holdings to see your asset allocation here.</p>}<div className="market-note"><span className="market-dot"/><div><strong>Market context is not connected</strong><span>Short-term market moves cannot predict future performance.</span></div></div><div className="risk-row"><span>Risk profile</span><strong>{riskProfile.charAt(0) + riskProfile.slice(1).toLowerCase()}</strong></div></article>
          </div>
          <footer className="page-footer"><span>Your account data · Actions are recorded for review only</span><span><Icon name="shield" size={14}/> Your financial choices stay in your hands</span></footer>
          </>}
        </div>
      </section>

      {isMobile && sidebarExpanded && <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}

      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><section className="copilot-modal" role="dialog" aria-modal="true" aria-labelledby="copilot-title"><div className="modal-top"><div className="modal-brand"><span><Icon name="spark" size={18}/></span> SIP Compass <small>DECISION CHECK-IN</small></div><button className="modal-close" aria-label="Close" onClick={() => setModal(false)}><Icon name="close" size={19}/></button></div><div className="modal-body"><div className="modal-eyebrow">BEFORE YOU CONFIRM</div><h2 id="copilot-title">Let’s look at the full picture.</h2><p className="modal-lede">A quick check-in to help you understand what this change could mean. The decision is always yours.</p>
        <div className="choice-toggle"><button className={mode === "pause" ? "selected" : ""} onClick={() => setMode("pause")}>Pause SIP</button><button className={mode === "reduce" ? "selected" : ""} onClick={() => setMode("reduce")}>Reduce amount</button></div>
        {mode === "pause" ? <div className="duration-picker"><label htmlFor="months">How long would you like to pause?</label><div className="select-wrap"><Icon name="calendar" size={17}/><select id="months" value={months} onChange={(e) => setMonths(Number(e.target.value))}><option value={1}>1 month</option><option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option></select><Icon name="chevron" size={15}/></div></div> : <div className="duration-picker"><label htmlFor="new-amount">New monthly investment</label><div className="amount-input-wrap"><span>₹</span><input id="new-amount" type="number" min="500" max={maximumReducedAmount} step="500" value={reducedAmount} onChange={(e) => setReducedAmount(Math.max(500, Math.min(maximumReducedAmount, Number(e.target.value) || 500)))}/><span className="input-suffix">per month</span></div><div className="field-hint">Your current SIP is {inr(currentSipAmount)} per month.</div></div>}
        <div className="impact-card"><div className="impact-icon"><Icon name="wallet" size={18}/></div><div className="impact-main"><span>Planned contributions over {months} {months === 1 ? "month" : "months"}</span><div className="impact-compare"><strong>{inr(impact.contributionsAtNewRate)}</strong><span>instead of</span><del>{inr(impact.contributionsAtCurrentRate)}</del></div><small>{inr(impact.totalDifference)} less contributed during this period</small></div></div>
        <div className="context-callout"><span className="callout-icon"><Icon name="target" size={17}/></span><p>{goal ? <>This SIP is linked to <strong>{goal.name}</strong>, with about {goal.yearsRemaining} years until your target.</> : "No goal is linked to this SIP."} Changing contributions may affect your plan; this view does not forecast returns.</p></div>
        <div className="market-callout"><span className="market-dot"/><p>Market data is not connected. Short-term market moves alone can’t tell us what happens next.</p></div>
        {contextLoading && <div className="ai-explanation loading-explanation"><span className="loading-dot"/><p>Putting your SIP and goal context together…</p></div>}
        {explanation && <div className="ai-explanation"><div className="ai-title"><Icon name="spark" size={15}/><strong>{explanation.headline}</strong><span>{explanation.model === "gemini" ? `AI EXPLANATION${explanation.modelName ? ` · ${explanation.modelName}` : ""}` : "GUIDED EXPLANATION"}</span></div>{explanation.reasonCode && <div className="fallback-reason">{explanation.reasonCode === "provider_http_503" ? "Gemini is temporarily busy. Showing the guided explanation instead." : "Gemini isn’t available right now. Showing the guided explanation instead."}</div>}<p>{explanation.explanation}</p><ul>{explanation.considerations.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
        {contextError && <div className="api-error" role="alert">{contextError}</div>}
        <div className="modal-disclaimer"><Icon name="info" size={15}/><span>Based on your account data. Contribution math is exact; future investment values are not predicted.</span></div>
        </div><div className="modal-footer"><button className="modal-keep" onClick={() => setModal(false)}>Keep current SIP</button><button className="modal-confirm" onClick={finalize} disabled={saving || contextLoading}>{saving ? "Saving choice…" : mode === "pause" ? "Continue to pause" : "Continue with reduction"}<Icon name="chevron" size={16}/></button><span>You can review before any real instruction is sent.</span></div></section></div>}
    </main>
  );
}
