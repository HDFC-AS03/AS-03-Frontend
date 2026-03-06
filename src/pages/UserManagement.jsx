import React, { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8000";
const ROLES = ["Manager", "User"];
const PAGE_SIZE = 5;

function StatusChip({ status }) {
  const config = {
    Active: { color: "green" },
    Inactive: { color: "orange" },
    Suspended: { color: "red" },
  }[status] || { color: "gray" };

  return (
    <span style={{ color: config.color, fontWeight: 600 }}>
      {status}
    </span>
  );
}

export default function UserManagement() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "User"
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // ─────────────────────────
  // LOAD USERS
  // ─────────────────────────
  const loadUsers = async () => {

    setLoading(true);

    try {

      const res = await fetch(`${API_BASE}/admin/users`, {
        credentials: "include"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const data = json.data ?? json;

      const formatted = data.map(u => ({
        id: u.id,
        name: u.firstName || u.username || "User",
        email: u.email,
        role: u.roles?.[0] || "User",
        status: u.enabled ? "Active" : "Inactive",
      }));

      setUsers(formatted);

    } catch (err) {
      alert("Failed to load users: " + err.message);
    }

    setLoading(false);
  };

  // ─────────────────────────
  // ADD USER
  // ─────────────────────────
  const handleAdd = async () => {

    if (!form.email) {
      alert("Email required");
      return;
    }

    try {

      const payload = [{
        username: form.email.split("@")[0],
        email: form.email,
        password: "ChangeMe123!",
        role: form.role
      }];

      const res = await fetch(`${API_BASE}/admin/bulk-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await loadUsers();
      setModal(null);

    } catch (err) {
      alert("Add user failed: " + err.message);
    }
  };

  // ─────────────────────────
  // UPDATE ROLE
  // ─────────────────────────
  const handleEdit = async () => {

    try {

      const res = await fetch(`${API_BASE}/admin/users/${modal.user.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role_name: form.role })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await loadUsers();
      setModal(null);

    } catch (err) {
      alert("Role update failed: " + err.message);
    }
  };

  // ─────────────────────────
  // DELETE USER
  // ─────────────────────────
  const handleDelete = async () => {

    try {

      const res = await fetch(`${API_BASE}/admin/users/${modal.user.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await loadUsers();
      setModal(null);

    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // ─────────────────────────
  // CSV IMPORT
  // ─────────────────────────
  const handleFileUpload = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {

      const lines = event.target.result.split("\n").slice(1);

      const users = lines.map(line => {

        const [name, email, role] = line.split(",");

        if (!email) return null;

        return {
          username: email.split("@")[0],
          email: email.trim(),
          password: "ChangeMe123!",
          role: role?.trim() || "User"
        };

      }).filter(Boolean);

      try {

        const res = await fetch(`${API_BASE}/admin/bulk-users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(users)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        await loadUsers();

        alert("Users imported successfully");

      } catch (err) {
        alert("Import failed: " + err.message);
      }

    };

    reader.readAsText(file);
  };

  // ─────────────────────────
  // FILTER
  // ─────────────────────────
  const filtered = users.filter(u =>
    [u.name, u.email, u.role, u.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paged = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // ─────────────────────────
  // UI
  // ─────────────────────────
  return (
    <div style={{ padding: 20 }}>

      <h2>User Management</h2>

      <div style={{ marginBottom: 20 }}>

        <button onClick={() => {
          setForm({ name: "", email: "", role: "User" });
          setModal({ type: "add" });
        }}>
          Add User
        </button>

        <button
          style={{ marginLeft: 10 }}
          onClick={() => fileInputRef.current.click()}
        >
          Import CSV
        </button>

        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept=".csv"
          onChange={handleFileUpload}
        />

      </div>

      <input
        placeholder="Search users..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {loading ? (
        <p>Loading users...</p>
      ) : (

        <table border="1" cellPadding="10" style={{ marginTop: 20 }}>

          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {paged.map(u => (

              <tr key={u.id}>

                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td><StatusChip status={u.status} /></td>

                <td>

                  <button
                    onClick={() => {
                      setForm(u);
                      setModal({ type: "edit", user: u });
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setModal({ type: "delete", user: u })}
                    style={{ marginLeft: 6 }}
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>
      )}

      <div style={{ marginTop: 20 }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          Prev
        </button>

        <span style={{ margin: "0 10px" }}>
          Page {page} / {totalPages}
        </span>

        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>

      {/* ───────── MODALS ───────── */}

      {modal?.type === "add" && (
        <div className="modal">
          <h3>Add User</h3>

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>

          <div style={{ marginTop: 10 }}>
            <button onClick={handleAdd}>Create</button>
            <button onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {modal?.type === "edit" && (
        <div className="modal">
          <h3>Edit Role</h3>

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>

          <div style={{ marginTop: 10 }}>
            <button onClick={handleEdit}>Update</button>
            <button onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {modal?.type === "delete" && (
        <div className="modal">
          <h3>Delete User</h3>

          <p>Delete {modal.user.email} ?</p>

          <button onClick={handleDelete}>Confirm</button>
          <button onClick={() => setModal(null)}>Cancel</button>
        </div>
      )}

    </div>
  );
}