import React, { useEffect, useState, useRef } from "react";
import { getCurrentUser, logout, refreshAccessToken, parseTokensFromHash } from "../api/auth";
import "./Dashboard.css";

// ─── ROLE DETECTION ───────────────────────────────────────────────────────────
function detectRole(user) {
  const email    = user?.email?.toLowerCase() || "";
  const username = user?.preferred_username?.toLowerCase() || "";
  const roles    = user?.roles || [];

  if (roles.includes("admin")   || email.includes("admin")   || username === "admin")   return "admin";
  if (roles.includes("manager") || email.includes("manager") || username === "manager") return "manager";
  return "user";
}

// ─── SIDEBAR CONFIG ───────────────────────────────────────────────────────────
const SIDEBAR_CONFIG = {
  admin: {
    brand: "BankDash. Admin",
    accentVar: "--admin-accent",
    navItems: [
      { icon: "⊞",  label: "System Overview",  active: true  },
      { icon: "👥", label: "User Management",  active: false },
      { icon: "🔐", label: "Security Logs",    active: false },
      { icon: "⚙️", label: "API Settings",     active: false },
      { icon: "📊", label: "Audit Trail",      active: false },
      { icon: "🛠️", label: "Configuration",    active: false },
    ],
  },
  manager: {
    brand: "BankDash.",
    accentVar: "--mgr-accent",
    navItems: [
      { icon: "⊞",  label: "Overview",   active: true  },
      { icon: "📩", label: "Inbox",      active: false },
      { icon: "👤", label: "Accounts",   active: false },
      { icon: "📄", label: "Invoices",   active: false },
      { icon: "📈", label: "Planning",   active: false },
      { icon: "⚙️", label: "Settings",   active: false },
    ],
  },
  user: {
    brand: "BankDash.",
    accentVar: "--user-accent",
    navItems: [
      { icon: "⊞",  label: "My Wallet",    active: true  },
      { icon: "🔄", label: "Transactions", active: false },
      { icon: "💳", label: "Cards",        active: false },
      { icon: "🏦", label: "Savings",      active: false },
      { icon: "💬", label: "Support",      active: false },
    ],
  },
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
function BarChart({ bars, color }) {
  const max = Math.max(...bars);
  return (
    <div className="bar-chart">
      {bars.map((v, i) => (
        <div key={i} className="bar-col">
          <div
            className="bar-fill"
            style={{
              height: `${(v / max) * 100}%`,
              background: color,
              animationDelay: `${i * 60}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 100, height = 32 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible", display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`${color}25`}
        stroke="none"
      />
    </svg>
  );
}

// ─── DONUT RING ───────────────────────────────────────────────────────────────
function DonutRing({ segments, total, label }) {
  const r = 52, cx = 64, cy = 64, circ = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
      {segments.map((seg, i) => {
        const frac = seg.value / total;
        const dash = frac * circ;
        const offset = circ - cum * circ;
        cum += frac;
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="18"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={offset}
            transform="rotate(-90 64 64)"
            style={{ transition: "stroke-dasharray 0.9s ease" }}
          />
        );
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1e293b">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">{label}</text>
    </svg>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function AdminView({ user }) {
  const auditLogs = [
    { icon: "🔑", ev: "Admin login",     actor: user?.preferred_username || "admin", time: "Just now",  col: "#10b981" },
    { icon: "🛡️", ev: "Role updated",   actor: "system",                             time: "5 min ago", col: "#f97316" },
    { icon: "🚫", ev: "Failed login",   actor: "unknown",                             time: "12 min",    col: "#ef4444" },
    { icon: "📤", ev: "Data export",    actor: "manager01",                           time: "1h ago",    col: "#6366f1" },
    { icon: "💾", ev: "Backup created", actor: "system",                             time: "3h ago",    col: "#10b981" },
  ];
  const trafficBars = [38, 52, 45, 68, 72, 65, 80, 77, 90, 85, 95, 92];

  return (
    <>
      {/* System status strip */}
      <div className="admin-status-strip">
        {[
          { label: "System Status",  val: "🟢 Operational", },
          { label: "Active Sessions",val: "384"             },
          { label: "DB Uptime",      val: "99.9%"           },
          { label: "Last Backup",    val: "3h ago"          },
          { label: "Pending Alerts", val: "3 Critical", alert: true },
        ].map(({ label, val, alert }) => (
          <div key={label} className="strip-item">
            <span className="strip-label">{label}</span>
            <span className={`strip-val ${alert ? "strip-alert" : ""}`}>{val}</span>
          </div>
        ))}
      </div>

      {/* KPI cards */}
      <div className="kpi-row four-col">
        {[
          { label: "Total Users",      val: "14,203", trend: "+8%",  up: true,  icon: "👤" },
          { label: "Active Sessions",  val: "384",    trend: "+15%", up: true,  icon: "⚡" },
          { label: "Failed Logins",    val: "23",     trend: "-41%", up: true,  icon: "🚫" },
          { label: "Audit Events",     val: "1,204",  trend: "+2%",  up: false, icon: "📋" },
        ].map((k, i) => (
          <div key={i} className="kpi-card admin-kpi" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="kpi-top">
              <div className="kpi-icon-box admin-icon-box">{k.icon}</div>
              <div className={`kpi-badge ${k.up ? "badge-up" : "badge-down"}`}>{k.trend}</div>
            </div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mid-row">
        {/* Traffic chart */}
        <div className="card flex-2">
          <div className="card-head">
            <h3>System Traffic</h3>
            <div className="period-tabs">
              {["24h", "7d", "30d"].map((p, i) => (
                <span key={p} className={`period-tab ${i === 0 ? "active-tab admin-tab" : ""}`}>{p}</span>
              ))}
            </div>
          </div>
          <div className="chart-row">
            <BarChart bars={trafficBars} color="var(--admin-accent)" />
            <div className="chart-side-legend">
              {[["🌐","Web","8,432"],["📱","Mobile","4,210"],["🔌","API","1,561"]].map(([ic,l,v])=>(
                <div key={l} className="legend-row">
                  <span>{ic}</span>
                  <div>
                    <div className="legend-label">{l}</div>
                    <div className="legend-val">{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System health */}
        <div className="card flex-1">
          <div className="card-head"><h3>System Health</h3></div>
          {[
            { label: "CPU Usage",  val: 34, color: "var(--admin-accent)" },
            { label: "Memory",     val: 61, color: "#f97316"             },
            { label: "Disk",       val: 48, color: "#10b981"             },
            { label: "Network I/O",val: 72, color: "#6366f1"             },
          ].map((m) => (
            <div key={m.label} className="health-row">
              <div className="health-label-row">
                <span className="health-label">{m.label}</span>
                <span className="health-pct" style={{ color: m.color }}>{m.val}%</span>
              </div>
              <ProgressBar value={m.val} color={m.color} />
            </div>
          ))}
        </div>
      </div>

      <div className="bot-row">
        {/* User table */}
        <div className="card flex-2">
          <div className="card-head">
            <h3>User Management</h3>
            <button className="add-btn admin-add-btn">+ Add User</button>
          </div>
          <div className="user-table">
            <div className="table-head">
              {["User", "Role", "Status", "Last Login", ""].map((h) => (
                <span key={h} className="th">{h}</span>
              ))}
            </div>
            {[
              { name: "Alice Chen",  email: "alice@bank.io",  role: "User",    status: "Active",    last: "2 min ago",  av: "AC" },
              { name: "Bob Reyes",   email: "bob@bank.io",    role: "Manager", status: "Active",    last: "14 min ago", av: "BR" },
              { name: "David Kim",   email: "david@bank.io",  role: "User",    status: "Suspended", last: "2 days ago", av: "DK" },
              { name: "Emeka Osei",  email: "emeka@bank.io",  role: "Analyst", status: "Active",    last: "1h ago",     av: "EO" },
            ].map((u, i) => (
              <div key={i} className="table-row">
                <div className="td user-cell">
                  <div className="mini-av admin-av">{u.av}</div>
                  <div>
                    <div className="cell-name">{u.name}</div>
                    <div className="cell-sub">{u.email}</div>
                  </div>
                </div>
                <div className="td"><span className="role-chip">{u.role}</span></div>
                <div className="td">
                  <span className={`status-chip ${u.status === "Active" ? "chip-green" : "chip-red"}`}>
                    {u.status}
                  </span>
                </div>
                <div className="td cell-sub">{u.last}</div>
                <div className="td action-cell">
                  {["✏️", "🗑️"].map((ic) => (
                    <button key={ic} className="action-btn">{ic}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit log */}
        <div className="card flex-1">
          <div className="card-head"><h3>Audit Log</h3></div>
          <div className="audit-list">
            {auditLogs.map((e, i) => (
              <div key={i} className="audit-row">
                <div className="audit-icon-box" style={{ background: `${e.col}18` }}>
                  <span>{e.icon}</span>
                </div>
                <div className="audit-text">
                  <div className="audit-ev">{e.ev}</div>
                  <div className="audit-actor">by {e.actor}</div>
                </div>
                <div className="audit-time">{e.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function ManagerView({ user }) {
  const revBars = [120, 135, 118, 145, 160, 152, 170, 165, 180, 175, 195, 210];
  const months  = ["J","F","M","A","M","J","J","A","S","O","N","D"];

  return (
    <>
      {/* KPI cards */}
      <div className="kpi-row four-col">
        {[
          { label: "Total Revenue",    val: "$284K",  trend: "+12%", up: true,  icon: "💰" },
          { label: "Managed Accounts", val: "1,482",  trend: "+4%",  up: true,  icon: "👥" },
          { label: "Invoices Sent",    val: "327",    trend: "-3%",  up: false, icon: "📄" },
          { label: "Open Tickets",     val: "14",     trend: "-22%", up: true,  icon: "🎫" },
        ].map((k, i) => (
          <div key={i} className="kpi-card mgr-kpi" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="kpi-top">
              <div className="kpi-icon-box mgr-icon-box">{k.icon}</div>
              <div className={`kpi-badge ${k.up ? "badge-up" : "badge-down"}`}>{k.trend}</div>
            </div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mid-row">
        {/* Revenue bar chart */}
        <div className="card flex-2">
          <div className="card-head">
            <h3>Revenue Overview</h3>
            <div className="period-tabs">
              {["W", "M", "Y"].map((p, i) => (
                <span key={p} className={`period-tab ${i === 1 ? "active-tab mgr-tab" : ""}`}>{p}</span>
              ))}
            </div>
          </div>
          <div className="rev-bar-wrap">
            <div className="rev-bars">
              {revBars.map((v, i) => (
                <div key={i} className="rev-bar-col">
                  <div
                    className="rev-bar-fill"
                    style={{
                      height: `${(v / 210) * 100}%`,
                      background: i === 11 ? "var(--mgr-accent)" : "var(--mgr-light)",
                      boxShadow: i === 11 ? "0 8px 20px var(--mgr-shadow)" : "none",
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                  <div className="rev-bar-label">{months[i]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spend donut */}
        <div className="card flex-1">
          <div className="card-head"><h3>Spend Mix</h3></div>
          <div className="donut-wrap">
            <DonutRing
              total={6870}
              label="Total"
              segments={[
                { value: 1332, color: "var(--mgr-accent)" },
                { value: 2302, color: "#a78bfa" },
                { value: 1899, color: "#38bdf8" },
                { value: 1337, color: "#fb923c" },
              ]}
            />
            <div className="donut-legend">
              {[["Online","$1,332","var(--mgr-accent)"],["Entertain","$2,302","#a78bfa"],["Services","$1,899","#38bdf8"],["Shopping","$1,337","#fb923c"]].map(([l,v,c])=>(
                <div key={l} className="donut-leg-row">
                  <div className="donut-dot" style={{ background: c }} />
                  <div>
                    <div className="donut-leg-label">{l}</div>
                    <div className="donut-leg-val">{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bot-row">
        {/* Team performance */}
        <div className="card flex-2">
          <div className="card-head"><h3>Team Performance</h3></div>
          <div className="team-list">
            {[
              { name: "Sarah Johnson", role: "Senior Analyst",   perf: 92, av: "SJ" },
              { name: "Mike Chen",     role: "Risk Manager",     perf: 85, av: "MC" },
              { name: "Priya Patel",   role: "Compliance Lead",  perf: 78, av: "PP" },
              { name: "James Lee",     role: "Client Relations", perf: 95, av: "JL" },
            ].map((m, i) => (
              <div key={i} className="team-row">
                <div className="mini-av mgr-av">{m.av}</div>
                <div className="team-info">
                  <div className="team-name-row">
                    <div>
                      <div className="cell-name">{m.name}</div>
                      <div className="cell-sub">{m.role}</div>
                    </div>
                    <div className="team-pct" style={{ color: "var(--mgr-accent)" }}>{m.perf}%</div>
                  </div>
                  <ProgressBar value={m.perf} color="var(--mgr-accent)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="card flex-1">
          <div className="card-head"><h3>Recent Invoices</h3></div>
          <div className="invoice-list">
            {[
              { id: "#INV-0041", client: "Acme Corp",    amt: "$4,200", status: "Paid"    },
              { id: "#INV-0040", client: "Globex Ltd",   amt: "$1,800", status: "Pending" },
              { id: "#INV-0039", client: "Initech",      amt: "$9,500", status: "Paid"    },
              { id: "#INV-0038", client: "Umbrella Inc", amt: "$640",   status: "Overdue" },
            ].map((inv, i) => (
              <div key={i} className="invoice-row">
                <div>
                  <div className="inv-id">{inv.id}</div>
                  <div className="cell-sub">{inv.client}</div>
                </div>
                <div className="inv-right">
                  <div className="inv-amt">{inv.amt}</div>
                  <span className={`status-chip ${inv.status === "Paid" ? "chip-green" : inv.status === "Overdue" ? "chip-red" : "chip-yellow"}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function UserView({ user }) {
  const spendData = [420, 380, 510, 490, 620, 570, 680, 610, 750, 720, 800, 780];

  return (
    <>
      {/* Balance hero */}
      <div className="balance-hero">
        <div className="balance-left">
          <div className="balance-label">Total Balance</div>
          <div className="balance-val">$24,830<span className="balance-cents">.50</span></div>
          <div className="balance-meta">
            <div className="balance-meta-item">
              <span className="meta-label">Income</span>
              <span className="meta-val income">+$3,240</span>
            </div>
            <div className="balance-meta-item">
              <span className="meta-label">Expenses</span>
              <span className="meta-val expense">-$1,890</span>
            </div>
          </div>
        </div>
        <div className="balance-card-chip">
          <div className="chip-number">•••• •••• •••• 4291</div>
          <div className="chip-type">Visa Platinum</div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-row three-col">
        {[
          { label: "Savings",   val: "$12,400", trend: "+5.2%", up: true,  data: [1200,1250,1180,1300,1420,1500,1620,1700] },
          { label: "Spending",  val: "$1,890",  trend: "-2.1%", up: false, data: [340,380,290,420,380,340,410,380] },
          { label: "Transfers", val: "$3,240",  trend: "+11%",  up: true,  data: [800,950,870,1100,1050,1200,1150,1300] },
        ].map((k, i) => (
          <div key={i} className="kpi-card user-kpi" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="kpi-top">
              <span className="kpi-label-sm">{k.label}</span>
              <div className={`kpi-badge ${k.up ? "badge-up" : "badge-down"}`}>{k.trend}</div>
            </div>
            <div className="kpi-val">{k.val}</div>
            <Sparkline data={k.data} color={k.up ? "var(--user-accent)" : "#ef4444"} width={120} height={36} />
          </div>
        ))}
      </div>

      <div className="mid-row">
        {/* Transactions */}
        <div className="card flex-2">
          <div className="card-head">
            <h3>Recent Transactions</h3>
            <span className="see-all">See all →</span>
          </div>
          <div className="tx-list">
            {[
              { icon: "🛍️", name: "Amazon Shopping", cat: "Shopping",     amt: "-$89.99",  date: "Today, 2:30pm", col: "#ef4444" },
              { icon: "💡", name: "Electric Bill",   cat: "Utilities",    amt: "-$124.00", date: "Yesterday",     col: "#ef4444" },
              { icon: "💰", name: "Salary Credit",   cat: "Income",       amt: "+$3,240",  date: "Mar 1",         col: "#10b981" },
              { icon: "🎵", name: "Spotify",         cat: "Subscription", amt: "-$9.99",   date: "Feb 28",        col: "#ef4444" },
              { icon: "🍕", name: "Domino's Pizza",  cat: "Food",         amt: "-$24.50",  date: "Feb 27",        col: "#ef4444" },
            ].map((tx, i) => (
              <div key={i} className="tx-row">
                <div className="tx-icon-box">{tx.icon}</div>
                <div className="tx-info">
                  <div className="cell-name">{tx.name}</div>
                  <div className="cell-sub">{tx.cat} · {tx.date}</div>
                </div>
                <div className="tx-amt" style={{ color: tx.col }}>{tx.amt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Spend chart */}
        <div className="right-col">
          <div className="card">
            <div className="card-head"><h3>Quick Actions</h3></div>
            <div className="quick-grid">
              {[["💸","Send"],["📥","Receive"],["🔄","Exchange"],["📋","Statement"],["🎯","Goals"],["🛡️","Insure"]].map(([ic,l])=>(
                <div key={l} className="quick-btn">
                  <span className="quick-icon">{ic}</span>
                  <span className="quick-label">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Monthly Spend</h3></div>
            <div className="spend-spark">
              <Sparkline data={spendData} color="var(--user-accent)" width={200} height={60} />
              <div className="spend-labels">
                {["Jan","","","Apr","","","Jul","","","Oct","","Dec"].map((l,i)=>(
                  <span key={i} className="spend-label">{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY SIDEBAR CARD (shared right panel)
// ═══════════════════════════════════════════════════════════════════════════════
function IdentityCard({ user, roleType }) {
  return (
    <div className="identity-panel">
      <div className="card identity-card">
        <h3>Identity & Access</h3>
        <div className="identity-avatar" style={{ background: `var(--${roleType === "admin" ? "admin" : roleType === "manager" ? "mgr" : "user"}-accent)` }}>
          {(user?.preferred_username || "U").substring(0, 2).toUpperCase()}
        </div>
        <div className="identity-name">{user?.name || user?.preferred_username || "User"}</div>
        <div className="identity-email">{user?.email || "user@auth.com"}</div>
        <div className="identity-fields">
          <div className="id-field">
            <span className="id-field-label">Username</span>
            <span className="id-field-val">{user?.preferred_username || "—"}</span>
          </div>
          <div className="id-field">
            <span className="id-field-label">Email</span>
            <span className="id-field-val" style={{ wordBreak: "break-all" }}>{user?.email || "—"}</span>
          </div>
        </div>
        <div className="role-section">
          {(user?.roles?.length > 0 ? user.roles : ["default-role"]).map((r, i) => (
            <div key={i} className="role-tag">
              <span>🛡️</span> {r}
            </div>
          ))}
        </div>
      </div>

      <div className="card status-card">
        {[
          { icon: "👤", bg: "#e7ffeb", col: "#10b981", title: "Online",    sub: "Active Status"         },
          { icon: "🕒", bg: "#fff5e9", col: "#ffbb38", title: "Session",   sub: "Token Active"          },
          { icon: "🔒", bg: "#f0f4ff", col: "#6366f1", title: "Protected", sub: `${roleType} privileges` },
        ].map(({ icon, bg, col, title, sub }) => (
          <div key={title} className="status-row">
            <div className="status-icon-box" style={{ background: bg, color: col }}>{icon}</div>
            <div>
              <div className="status-title">{title}</div>
              <div className="status-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard() {
  const [user, setUser]               = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [timeLeft, setTimeLeft]       = useState(null);
  const profileRef = useRef(null);

  useEffect(() => {
    // Parse tokens from URL hash if present (after OAuth callback)
    parseTokensFromHash();
    
    getCurrentUser()
      .then((u) => {
        setUser(u);
        setIsLoading(false);
        // Seed timer from token expiry if available
        if (u?.exp) {
          const remaining = u.exp - Math.floor(Date.now() / 1000);
          setTimeLeft(remaining > 0 ? remaining : 0);
        }
      })
      .catch(() => setIsLoading(false));
  }, []);

  // ── Countdown tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { logout(); return; }

    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(iv); logout(); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(iv);
  }, [timeLeft === null]); // only re-run when timer first becomes available

  // ── Refresh token at 30 s remaining ────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 30) return;
    refreshAccessToken()
      .then((success) => {
        if (!success) throw new Error('Refresh failed');
        return getCurrentUser();
      })
      .then((u) => {
        setUser(u);
        if (u?.exp) {
          const remaining = u.exp - Math.floor(Date.now() / 1000);
          setTimeLeft(remaining > 0 ? remaining : 0);
        }
      })
      .catch(() => logout());
  }, [timeLeft]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-screen">
        <div className="error-card">
          <h2>Not authenticated</h2>
          <p>Please log in via Keycloak to continue.</p>
        </div>
      </div>
    );
  }

  const roleType = detectRole(user);
  const cfg      = SIDEBAR_CONFIG[roleType];

  const pageTitle = {
    admin:   "Administrator Console",
    manager: "Manager's Dashboard",
    user:    "My Wallet Dashboard",
  }[roleType];

  const initials = (user?.preferred_username || user?.name || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={`layout role-${roleType}`}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="brand">{cfg.brand}</div>

        <nav className="nav-menu">
          {cfg.navItems.map(({ icon, label, active }) => (
            <a
              key={label}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`nav-item ${active ? "nav-active" : ""}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-chip">
            <div className="sidebar-av">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">{user?.preferred_username || "User"}</div>
              <div className="sidebar-role">{roleType}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <div className="main-wrap">

        {/* Header */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{pageTitle}</h1>
            {timeLeft !== null && (() => {
              const mins = Math.floor(timeLeft / 60);
              const secs = timeLeft % 60;
              const isUrgent = timeLeft <= 30;
              const isLow    = timeLeft <= 120;
              return (
                <div className={`session-timer ${isUrgent ? "timer-urgent" : isLow ? "timer-low" : "timer-ok"}`}>
                  <span className="timer-icon">⏱</span>
                  <span className="timer-text">{mins}m {String(secs).padStart(2, "0")}s</span>
                  <span className="timer-label">session</span>
                </div>
              );
            })()}
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="Search for something" />
            </div>

            <button className="icon-circle-btn">⚙️</button>
            <button className="icon-circle-btn notif-btn">🔔<span className="notif-dot" /></button>

            {/* Profile dropdown */}
            <div className="profile-wrap" ref={profileRef}>
              <button
                className="avatar-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
              >
                <div className="avatar-circle">{initials}</div>
              </button>

              {profileOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-user">
                    <div className="dropdown-av">{initials}</div>
                    <div>
                      <div className="dropdown-name">{user?.name || user?.preferred_username || "User"}</div>
                      <div className="dropdown-email">{user?.email || "user@auth.com"}</div>
                    </div>
                  </div>
                  <div className="dropdown-role-pill">{roleType}</div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-logout" onClick={logout}>
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content-area">
          <div className="content-main">
            {roleType === "admin"   && <AdminView   user={user} />}
            {roleType === "manager" && <ManagerView user={user} />}
            {roleType === "user"    && <UserView    user={user} />}
          </div>

          <IdentityCard user={user} roleType={roleType} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;