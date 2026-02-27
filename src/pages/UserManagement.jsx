import React, { useState, useRef } from "react";

// ─── SAMPLE DATA & HELPERS ────────────────────────────────────────────────────
const INITIAL_USERS = [
  { id: 1, name: "Alice Chen",    email: "alice@bank.io",   role: "User",     status: "Active",    created: "04/10/2014", av: "AC" },
  { id: 2, name: "Bob Reyes",     email: "bob@bank.io",     role: "Manager",  status: "Active",    created: "06/09/2015", av: "BR" },
  { id: 3, name: "David Kim",     email: "david@bank.io",   role: "User",     status: "Inactive",  created: "09/05/2016", av: "DK" },
  { id: 4, name: "Emeka Osei",    email: "emeka@bank.io",   role: "Analyst",  status: "Suspended", created: "11/09/2018", av: "EO" },
  { id: 5, name: "Paula Wilson",  email: "paula@bank.io",   role: "User",     status: "Active",    created: "09/09/2019", av: "PW" },
];

const ROLES    = [ "Manager",  "User"];
const STATUSES = ["Active", "Inactive", "Suspended"];
const PAGE_SIZE = 5;

function StatusChip({ status }) {
  const config = {
    Active:    { cls: "chip-green",  dot: "#16a34a" },
    Inactive:  { cls: "chip-yellow", dot: "#ca8a04" },
    Suspended: { cls: "chip-red",    dot: "#dc2626" },
  }[status] || { cls: "chip-yellow", dot: "#ca8a04" };

  return (
    <span className={`status-chip ${config.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: "28px 30px",
        width: 440, boxShadow: "0 30px 70px rgba(0,0,0,0.18)",
        animation: "slideUp 0.2s ease both",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "#f1f5f9", border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", fontSize: 15,
            color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        color: "#64748b", marginBottom: 6,
        textTransform: "uppercase", letterSpacing: ".06em",
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 13px", borderRadius: 10,
  border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b",
  outline: "none", boxSizing: "border-box", background: "#f8fafc",
  fontFamily: "inherit", transition: "border .15s",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers]         = useState(INITIAL_USERS);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({ name: "", email: "", role: "User", status: "Active" });
  const [spinning, setSpinning]   = useState(false);
  const fileInputRef              = useRef(null); // Ref for hidden file input

  // Filtering & Pagination
  const filtered = users.filter(u =>
    [u.name, u.email, u.role, u.status].some(v =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Helpers
  const openAdd    = () => { setForm({ name: "", email: "", role: "User", status: "Active" }); setModal({ type: "add" }); };
  const openEdit   = (u) => { setForm({ name: u.name, email: u.email, role: u.role, status: u.status }); setModal({ type: "edit", user: u }); };
  const openDelete = (u) => setModal({ type: "delete", user: u });
  const closeModal = ()  => setModal(null);

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setUsers(prev => [{
      id: Date.now(),
      av: form.name.substring(0, 2).toUpperCase(),
      created: new Date().toLocaleDateString("en-US"),
      ...form,
    }, ...prev]);
    setPage(1);
    closeModal();
  };

  const handleEdit = () => {
    setUsers(prev => prev.map(u => u.id === modal.user.id ? { ...u, ...form } : u));
    closeModal();
  };

  const handleDelete = () => {
    setUsers(prev => prev.filter(u => u.id !== modal.user.id));
    closeModal();
  };

  const handleFetch = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 900);
  };

  // ─── IMPORT LOGIC ───────────────────────────────────────────────────────────
  const handleImportClick = () => {
    fileInputRef.current.click();
  };
const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r\n|\n/);
      const firstLine = lines[0] || "";
      const delimiter = firstLine.includes(";") ? ";" : ",";

      // 1. Create a Set of existing emails (lowercase for case-insensitive comparison)
      // We use a Set because checking "has()" is instant, unlike looping through arrays.
      const existingEmails = new Set(users.map(u => u.email.toLowerCase()));
      
      let duplicatesCount = 0;

      const newUsers = lines
        .slice(1) // Skip header
        .map((line, index) => {
          if (!line.trim()) return null;

          const cols = line.split(delimiter);
          const name = cols[0]?.trim().replace(/^"|"$/g, '');
          const email = cols[1]?.trim().replace(/^"|"$/g, '');
          
          if (!name || !email) return null;

          // 2. DUPLICATE CHECK
          const normalizedEmail = email.toLowerCase();
          
          if (existingEmails.has(normalizedEmail)) {
            duplicatesCount++;
            return null; // Skip this user
          }

          // Add to set so we don't add the same person twice if they appear multiple times in the CSV
          existingEmails.add(normalizedEmail); 

          return {
            id: Date.now() + Math.random(), 
            name: name,
            email: email, // Keep original casing for display
            role: cols[2] ? cols[2].trim().replace(/^"|"$/g, '') : "User",
            status: cols[3] ? cols[3].trim().replace(/^"|"$/g, '') : "Active",
            created: new Date().toLocaleDateString("en-US"),
            av: name.substring(0, 2).toUpperCase(),
          };
        })
        .filter(Boolean); // Remove nulls (duplicates and invalid lines)

      if (newUsers.length > 0) {
        setUsers(prev => [...newUsers, ...prev]);
        setSearch(""); 
        setPage(1); 
        
        // 3. Detailed Feedback
        if (duplicatesCount > 0) {
          alert(`Success! Imported ${newUsers.length} users.\n(Skipped ${duplicatesCount} duplicates)`);
        } else {
          alert(`Successfully imported ${newUsers.length} users!`);
        }
      } else if (duplicatesCount > 0) {
        alert(`No new users added. All ${duplicatesCount} entries were duplicates.`);
      } else {
        alert("No valid users found in CSV.");
      }
      
      e.target.value = null;
    };
    reader.readAsText(file);
  };
  // Grid Config
  const gridConfig = "44px 2.8fr 1.1fr 1fr 1.1fr 80px";

  // Stats
  const totalUsers    = users.length;
  const activeCount   = users.filter(u => u.status === "Active").length;
  const suspendCount  = users.filter(u => u.status === "Suspended").length;
  const inactiveCount = users.filter(u => u.status === "Inactive").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap');
        .um-tr { transition: background .12s; }
        .um-tr:hover { background: #f8fafc !important; }
        .um-action-btn { transition: opacity .15s, transform .15s; }
        .um-action-btn:hover { opacity: .75; transform: scale(1.1); }
        .um-page-btn:hover:not(:disabled) { background: #f1f5f9 !important; }
        .um-search:focus { border-color: #dc2626 !important; outline: none; }
        .um-add-btn:hover { opacity: .88 !important; transform: translateY(-1px); }
        .um-import-btn:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; }
        .um-fetch-btn:hover { background: #f1f5f9 !important; }
        @keyframes spin-icon { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        .status-chip { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .chip-green  { background: #dcfce7; color: #16a34a; }
        .chip-red    { background: #fee2e2; color: #dc2626; }
        .chip-yellow { background: #fef9c3; color: #ca8a04; }
      `}</style>

      {/* ─── HIDDEN FILE INPUT ─── */}
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        onChange={handleFileUpload} 
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
        
        {/* Stats Banner */}
        <div style={{
          background: "linear-gradient(130deg, #dc2626, #991b1b)",
          borderRadius: 18, padding: "24px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 12px 32px rgba(220,38,38,0.28)",
          animation: "slideUp 0.35s ease both",
        }}>
          {[
            { label: "Total Users",  val: totalUsers,    icon: "👥" },
            { label: "Active",       val: activeCount,   icon: "🟢" },
            { label: "Inactive",     val: inactiveCount, icon: "🟡" },
            { label: "Suspended",    val: suspendCount,  icon: "🔴" },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 24, marginBottom: 2 }}>{icon}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{val}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Controls Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 40, padding: "8px 16px",
            }}>
              <span style={{ fontSize: 14, color: "#94a3b8" }}>🔍</span>
              <input
                className="um-search"
                placeholder="Search users..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{
                  border: "none", background: "transparent", outline: "none",
                  fontSize: 13, color: "#64748b", width: 200, fontFamily: "inherit",
                }}
              />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {/* IMPORT BUTTON */}
            <button
              className="um-import-btn"
              onClick={handleImportClick}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 10,
                background: "#fff", border: "1.5px solid #e2e8f0",
                fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer",
                fontFamily: "inherit", transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 16 }}>📂</span> Import Users
            </button>

            {/* ADD USER BUTTON */}
            <button
              className="um-add-btn"
              onClick={openAdd}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10,
                background: "#dc2626", border: "none",
                fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
                fontFamily: "inherit", transition: "opacity .15s, transform .15s",
              }}
            >+ Add User</button>
          </div>
        </div>

        {/* Table Card */}
        <div style={{
          background: "#fff", borderRadius: 18,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
          animation: "slideUp 0.45s ease both",
        }}>
          {/* Card Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>User Directory</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" }}>
                {filtered.length} total entries
              </p>
            </div>
            <button
              className="um-fetch-btn"
              onClick={handleFetch}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 10,
                background: "#f8fafc", border: "1.5px solid #e2e8f0",
                fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer",
                fontFamily: "inherit", transition: "background .15s",
              }}
            >
              Fetch
              <span style={{ fontSize: 17, display: "inline-block", animation: spinning ? "spin-icon .7s linear infinite" : "none" }}>↻</span>
            </button>
          </div>

          {/* Table Head */}
          <div style={{
            display: "grid", gridTemplateColumns: gridConfig,
            gap: 8, padding: "11px 24px",
            background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
            alignItems: "center"
          }}>
            {["#", "Name", "Date Created", "Role", "Status", "Action"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div>
            {paged.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                No users match your search.
              </div>
            ) : paged.map((u, i) => (
              <div
                key={u.id}
                className="um-tr"
                style={{
                  display: "grid", gridTemplateColumns: gridConfig,
                  gap: 8, padding: "13px 24px",
                  alignItems: "center",
                  borderBottom: i < paged.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                  {(page - 1) * PAGE_SIZE + i + 1}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 11, overflow: "hidden" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    background: "linear-gradient(135deg, #dc2626, #fb7185)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#fff",
                  }}>{u.av}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                  </div>
                </div>

                <span style={{ fontSize: 13, color: "#64748b" }}>{u.created}</span>

                <div>
                  <span style={{
                    display: "inline-block", fontSize: 11, fontWeight: 600,
                    padding: "3px 10px", borderRadius: 20,
                    background: "#f1f5f9", color: "#475569",
                  }}>{u.role}</span>
                </div>

                <div><StatusChip status={u.status} /></div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button className="um-action-btn" onClick={() => openEdit(u)} title="Edit" style={{
                    width: 30, height: 30, borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0",
                    cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569"
                  }}>⚙️</button>
                  <button className="um-action-btn" onClick={() => openDelete(u)} title="Delete" style={{
                    width: 30, height: 30, borderRadius: 8, background: "#fff1f2", border: "1px solid #fecaca",
                    cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center"
                  }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px", borderTop: "1px solid #e2e8f0",
          }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} out of {filtered.length} entries
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className="um-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{
                padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                background: "#f8fafc", fontSize: 12, fontWeight: 600,
                color: page === 1 ? "#cbd5e1" : "#64748b",
                cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>Previous</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} className="um-page-btn" onClick={() => setPage(n)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1.5px solid",
                  borderColor: page === n ? "#dc2626" : "#e2e8f0",
                  background: page === n ? "#dc2626" : "#f8fafc",
                  color: page === n ? "#fff" : "#64748b",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  transition: "background .15s, color .15s",
                }}>{n}</button>
              ))}

              <button className="um-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{
                padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                background: "#f8fafc", fontSize: 12, fontWeight: 600,
                color: page === totalPages ? "#cbd5e1" : "#64748b",
                cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}
      {modal?.type === "add" && (
        <Modal title="Add New User" onClose={closeModal}>
          <Field label="Full Name">
            <input style={inputStyle} placeholder="e.g. Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input style={inputStyle} placeholder="jane@bank.io" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Role">
              <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={selectStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleAdd} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Add User</button>
          </div>
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title={`Edit — ${modal.user.name}`} onClose={closeModal}>
          <Field label="Full Name">
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Role">
              <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={selectStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleEdit} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#4f46e5", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Save Changes</button>
          </div>
        </Modal>
      )}

      {modal?.type === "delete" && (
        <Modal title="Delete User" onClose={closeModal}>
          <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🗑️</div>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "#1e293b" }}>{modal.user.name}</strong>?
              <br />This action cannot be undone.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleDelete} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#ef4444", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}