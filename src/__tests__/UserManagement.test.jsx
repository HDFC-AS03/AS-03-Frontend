/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserManagement from "../pages/UserManagement";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@example.com", enabled: true },
  { id: "2", firstName: "Bob", lastName: "Jones", email: "bob@example.com", enabled: false },
  { id: "3", firstName: "Carol", lastName: "White", email: "carol@example.com", enabled: true },
  { id: "4", firstName: "Dave", lastName: "Brown", email: "dave@example.com", enabled: true },
  { id: "5", firstName: "Eve", lastName: "Black", email: "eve@example.com", enabled: false },
  { id: "6", firstName: "Frank", lastName: "Green", email: "frank@example.com", enabled: true },
];

const MOCK_ROLES = [{ name: "manager" }, { name: "user" }];

// ─────────────────────────────────────────────────────────────────────────────
// Fetch Mock Setup
// ─────────────────────────────────────────────────────────────────────────────
function mockFetch(overrides = {}) {
  global.fetch = jest.fn((url, options = {}) => {
    const method = options.method?.toUpperCase() ?? "GET";

    // GET /admin/users
    if (url.includes("/admin/users") && !url.includes("/roles") && method === "GET") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: MOCK_USERS }),
      });
    }

    // GET /admin/users/:id/roles
    if (url.match(/\/admin\/users\/\d+\/roles$/) && method === "GET") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: MOCK_ROLES }),
      });
    }

    // POST /admin/bulk-users
    if (url.includes("/admin/bulk-users") && method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ data: [{ status: "created" }] }),
      });
    }

    // POST /admin/users/:id/roles (assign)
    if (url.match(/\/admin\/users\/\d+\/roles/) && method === "POST") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }

    // DELETE /admin/users/:id/roles (remove role)
    if (url.match(/\/admin\/users\/\d+\/roles/) && method === "DELETE") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }

    // PUT /admin/users/:id/roles (replace role)
    if (url.match(/\/admin\/users\/\d+\/roles/) && method === "PUT") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }

    // DELETE /admin/users/:id (delete user)
    if (url.match(/\/admin\/users\/\d+$/) && method === "DELETE") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }

    // Apply any caller-supplied overrides
    if (overrides[url]) return overrides[url](options);

    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve("Not Found") });
  });
}

beforeEach(() => {
  mockFetch();
  window.alert = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
const renderComponent = () => render(<UserManagement />);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initial Render & Data Loading
// ─────────────────────────────────────────────────────────────────────────────
describe("Initial render & data loading", () => {
  it("shows loading state initially", () => {
    renderComponent();
    expect(screen.getByText(/loading users/i)).toBeInTheDocument();
  });

  it("fetches and displays users after load", async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/loading users/i)).not.toBeInTheDocument());

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders correct status chips (Active / Inactive)", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    const activeChips = screen.getAllByText("Active");
    const inactiveChips = screen.getAllByText("Inactive");

    // Page 1 has 5 users: Alice✓ Bob✗ Carol✓ Dave✓ Eve✗
    expect(activeChips.length).toBeGreaterThanOrEqual(1);
    expect(inactiveChips.length).toBeGreaterThanOrEqual(1);
  });

  it("shows alert when user fetch fails", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    renderComponent();
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Failed to load users")));
  });

  it("uses username as display name when firstName is absent", async () => {
    const noName = [{ id: "99", username: "ghost_user", email: "ghost@example.com", enabled: true }];
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: noName }) })
    );
    renderComponent();
    await waitFor(() => screen.getByText("ghost_user"));
  });

  it("shows '—' when no name or username is available", async () => {
    const minimal = [{ id: "99", email: "nobody@example.com", enabled: true }];
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: minimal }) })
    );
    renderComponent();
    await waitFor(() => screen.getByText("—"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pagination
// ─────────────────────────────────────────────────────────────────────────────
describe("Pagination", () => {
  it("shows at most 5 users per page", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    // Only 5 of 6 users visible on page 1
    expect(screen.queryByText("Frank Green")).not.toBeInTheDocument();
  });

  it("navigates to the next page", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByText("Frank Green"));
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
  });

  it("disables Prev on first page and Next on last page", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByText("Frank Green"));

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /prev/i })).not.toBeDisabled();
  });

  it("resets to page 1 when search changes", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    // Go to page 2
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByText("Frank Green"));

    // Type in search
    fireEvent.change(screen.getByPlaceholderText(/search users/i), {
      target: { value: "alice" },
    });

    await waitFor(() => {
      expect(screen.getByText(/page.*1/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Search / Filter
// ─────────────────────────────────────────────────────────────────────────────
describe("Search / Filter", () => {
  it("filters users by name", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.change(screen.getByPlaceholderText(/search users/i), {
      target: { value: "alice" },
    });

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
    });
  });

  it("filters users by email", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.change(screen.getByPlaceholderText(/search users/i), {
      target: { value: "carol@example.com" },
    });

    await waitFor(() => {
      expect(screen.getByText("Carol White")).toBeInTheDocument();
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    });
  });

  it("filters users by status", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.change(screen.getByPlaceholderText(/search users/i), {
      target: { value: "inactive" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });
  });

  it("shows empty message when no users match", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.change(screen.getByPlaceholderText(/search users/i), {
      target: { value: "zzznomatch" },
    });

    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Add User Modal
// ─────────────────────────────────────────────────────────────────────────────
describe("Add User modal", () => {
  it("opens modal when '+ Add User' is clicked", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    expect(screen.getByText("Add New User")).toBeInTheDocument();
  });

  it("shows validation error when email is empty", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid email format", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it("submits successfully with valid email and closes modal", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() => {
      expect(screen.queryByText("Add New User")).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/bulk-users"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows backend error when create fails", async () => {
    global.fetch = jest.fn((url, options = {}) => {
      const method = options.method?.toUpperCase() ?? "GET";
      if (url.includes("/admin/users") && method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: MOCK_USERS }) });
      }
      if (url.includes("/admin/bulk-users") && method === "POST") {
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve("Server Error") });
      }
      return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve("Not Found") });
    });

    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "newuser@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText(/add user failed/i)).toBeInTheDocument();
  });

  it("closes modal when Cancel is clicked", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText("Add New User")).not.toBeInTheDocument();
    });
  });

  it("closes modal when clicking the overlay", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText("Add New User")).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Delete User Modal
// ─────────────────────────────────────────────────────────────────────────────
describe("Delete User modal", () => {
  it("opens delete confirmation for a user", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    const deleteButtons = screen.getAllByTitle("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(screen.getAllByText(/delete user/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
    expect(screen.getAllByText("alice@example.com").length).toBeGreaterThanOrEqual(1);
  });

  it("calls DELETE API and refreshes list on confirm", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getAllByTitle("Delete")[0]);
    fireEvent.click(screen.getByRole("button", { name: /delete user/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("closes modal on Cancel", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getAllByTitle("Delete")[0]);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText(/permanently delete/i)).not.toBeInTheDocument();
    });
  });

  it("shows alert when delete API fails", async () => {
    global.fetch = jest.fn((url, options = {}) => {
      const method = options.method?.toUpperCase() ?? "GET";
      if (method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: MOCK_USERS }) });
      }
      if (method === "DELETE") {
        return Promise.resolve({ ok: false, status: 403, text: () => Promise.resolve("Forbidden") });
      }
      return Promise.resolve({ ok: false });
    });

    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getAllByTitle("Delete")[0]);
    fireEvent.click(screen.getByRole("button", { name: /delete user/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Delete failed"));
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Role Manager Modal
// ─────────────────────────────────────────────────────────────────────────────
describe("Role Manager modal", () => {
  async function openRoleModal() {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getAllByTitle("Roles")[0]);
    await waitFor(() => screen.getByText(/manage roles/i));
  }

  it("opens role modal when shield button is clicked", async () => {
    await openRoleModal();
    expect(screen.getByText(/manage roles/i)).toBeInTheDocument();
  });

  it("displays current roles fetched from API", async () => {
    await openRoleModal();
    await waitFor(() => {
      // Check role chips exist specifically (not dropdown options)
      const chips = document.querySelectorAll(".role-chip");
      expect(chips.length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Manager").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("User").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows error when roles fetch fails", async () => {
    global.fetch = jest.fn((url, options = {}) => {
      const method = options.method?.toUpperCase() ?? "GET";
      if (url.includes("/admin/users") && !url.includes("/roles") && method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: MOCK_USERS }) });
      }
      if (url.includes("/roles") && method === "GET") {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: false });
    });

    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getAllByTitle("Roles")[0]);

    await waitFor(() => {
      expect(screen.getByText(/could not load current roles/i)).toBeInTheDocument();
    });
  });

  it("assigns a new role via POST", async () => {
    // Give user only one role so we can assign another
    global.fetch = jest.fn((url, options = {}) => {
      const method = options.method?.toUpperCase() ?? "GET";
      if (url.includes("/admin/users") && !url.includes("/roles") && method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: MOCK_USERS }) });
      }
      if (url.includes("/roles") && method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ name: "user" }] }) });
      }
      if (url.includes("/roles") && method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: false });
    });

    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getAllByTitle("Roles")[0]);
    await waitFor(() => screen.getByText(/manage roles/i));

    // Select Manager role and assign
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Manager" } });
    fireEvent.click(screen.getByRole("button", { name: /assign/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("role_name=manager"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("shows error when trying to assign already-assigned role", async () => {
    await openRoleModal();
    await waitFor(() => screen.getByText("Manager"));

    // Select "Manager" (already assigned)
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Manager" } });
    fireEvent.click(screen.getByRole("button", { name: /assign/i }));

    expect(await screen.findByText(/already listed/i)).toBeInTheDocument();
  });

  it("removes a role via DELETE", async () => {
    await openRoleModal();
    await waitFor(() => screen.getByText("Manager"));

    // Click × next to Manager chip
    const removeButtons = screen.getAllByTitle(/remove/i);
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("role_name=manager"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("replaces a role via PUT", async () => {
    await openRoleModal();
    await waitFor(() => screen.getByText("Manager"));

    // Select User in dropdown, replace Manager
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "User" } });

    const replaceBtn = screen.getByRole("button", { name: /manager.*user/i });
    fireEvent.click(replaceBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("old_role=manager"),
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("shows error when replacing with the same role", async () => {
    await openRoleModal();
    await waitFor(() => screen.getByText("Manager"));

    // Select Manager in dropdown, try to replace Manager with Manager
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Manager" } });

    const replaceBtn = screen.getByRole("button", { name: /manager.*manager/i });
    fireEvent.click(replaceBtn);

    expect(await screen.findByText(/pick a different role/i)).toBeInTheDocument();
  });

  it("closes modal when Done is clicked", async () => {
    await openRoleModal();

    fireEvent.click(screen.getByRole("button", { name: /done/i }));

    await waitFor(() => {
      expect(screen.queryByText(/manage roles/i)).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CSV Import
// ─────────────────────────────────────────────────────────────────────────────
describe("CSV Import", () => {
  const csvContent = `name,email,role\nAlice,alice2@example.com,user\nBob,bob2@example.com,manager`;

  it("triggers file input when Import CSV is clicked", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    const input = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: /import csv/i }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("posts users from CSV file and alerts success", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    const file = new File([csvContent], "users.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');

    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/bulk-users"),
        expect.objectContaining({ method: "POST" })
      );
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Import complete"));
    });
  });

  it("alerts when CSV has no valid rows", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    const emptyCSV = "name,email,role\n";
    const file = new File([emptyCSV], "empty.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');

    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("No valid users"));
    });
  });

  it("alerts when bulk import API fails", async () => {
    global.fetch = jest.fn((url, options = {}) => {
      const method = options.method?.toUpperCase() ?? "GET";
      if (method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: MOCK_USERS }) });
      }
      return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve("Error") });
    });

    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));

    const file = new File([csvContent], "users.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]');
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Import failed"));
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. StatusChip
// ─────────────────────────────────────────────────────────────────────────────
describe("StatusChip rendering", () => {
  it("applies chip-green class for Active status", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));
    const chip = screen.getAllByText("Active")[0].closest(".status-chip");
    expect(chip).toHaveClass("chip-green");
  });

  it("applies chip-yellow class for Inactive status", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Bob Jones"));
    const chip = screen.getAllByText("Inactive")[0].closest(".status-chip");
    expect(chip).toHaveClass("chip-yellow");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Avatar Initials
// ─────────────────────────────────────────────────────────────────────────────
describe("Avatar initials", () => {
  it("renders first two uppercase letters for named users", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("renders 'U' for users with no name", async () => {
    const minimal = [{ id: "99", email: "nobody@example.com", enabled: true }];
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: minimal }) })
    );
    renderComponent();
    await waitFor(() => screen.getByText("U"));
  });
});