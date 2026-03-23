/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Dashboard from "../pages/dashboard";

// ─────────────────────────────────────────────────────────────────────────────
// Mock external modules
// ─────────────────────────────────────────────────────────────────────────────
jest.mock("../api/auth", () => ({
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
}));

jest.mock("../pages/UserManagement", () => () => (
  <div data-testid="user-management">UserManagement Component</div>
));

import { getCurrentUser, logout } from "../api/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_USER = {
  preferred_username: "admin",
  name: "Admin User",
  email: "admin@example.com",
  roles: ["admin"],
  exp: Math.floor(Date.now() / 1000) + 600,
};

const MANAGER_USER = {
  preferred_username: "manager",
  name: "Manager User",
  email: "manager@example.com",
  roles: ["manager"],
  exp: Math.floor(Date.now() / 1000) + 600,
};

const PLAIN_USER = {
  preferred_username: "johndoe",
  name: "John Doe",
  email: "john@example.com",
  roles: ["user"],
  exp: Math.floor(Date.now() / 1000) + 600,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function mockUser(userData) {
  getCurrentUser.mockResolvedValue({ data: userData });
}

function renderDashboard() {
  return render(<Dashboard />);
}

// Click the avatar button by CSS class (has no accessible name)
function clickAvatar() {
  const btn = document.querySelector(".avatar-btn");
  fireEvent.click(btn);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  );
  Object.defineProperty(document, "cookie", { writable: true, value: "" });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Loading State
// ─────────────────────────────────────────────────────────────────────────────
describe("Loading state", () => {
  it("shows loading spinner while fetching user", () => {
    getCurrentUser.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it("hides loading spinner after user loads", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Unauthenticated State
// ─────────────────────────────────────────────────────────────────────────────
describe("Unauthenticated state", () => {
  it("shows not authenticated message when user fetch fails", async () => {
    getCurrentUser.mockRejectedValue(new Error("Unauthorized"));
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/not authenticated/i)).toBeInTheDocument()
    );
  });

  it("shows not authenticated when getCurrentUser returns null", async () => {
    getCurrentUser.mockResolvedValue(null);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/not authenticated/i)).toBeInTheDocument()
    );
  });

  it("shows login message when unauthenticated", async () => {
    getCurrentUser.mockRejectedValue(new Error("fail"));
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/log in via keycloak/i)).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Role Detection & Sidebar
// ─────────────────────────────────────────────────────────────────────────────
describe("Role detection & sidebar", () => {
  it("shows admin sidebar brand for admin user", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/mywallet.*admin/i)).toBeInTheDocument()
    );
  });

  it("shows manager sidebar brand for manager user", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/mywallet.*manager/i)).toBeInTheDocument()
    );
  });

  it("shows user sidebar brand for plain user", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/mywallet.*user/i)).toBeInTheDocument()
    );
  });

  it("detects admin role from email when roles array is empty", async () => {
    mockUser({ ...PLAIN_USER, email: "admin@example.com", roles: [] });
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/mywallet.*admin/i)).toBeInTheDocument()
    );
  });

  it("detects manager role from email", async () => {
    mockUser({ ...PLAIN_USER, email: "manager@example.com", roles: [] });
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/mywallet.*manager/i)).toBeInTheDocument()
    );
  });

  it("shows admin nav items for admin user", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/mywallet.*admin/i)).toBeInTheDocument()
    );
    screen.debug();
  });

  it("shows manager nav items for manager user", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Invoices")).toBeInTheDocument();
      expect(screen.getByText("Planning")).toBeInTheDocument();
    });
  });

  it("shows user nav items for plain user", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Wallet")).toBeInTheDocument();
      expect(screen.getByText("Transactions")).toBeInTheDocument();
      expect(screen.getByText("Cards")).toBeInTheDocument();
    });
  });

  it("hides Admin Console nav item for non-admin users", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText("Admin Console")).not.toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Page Title
// ─────────────────────────────────────────────────────────────────────────────
describe("Page title", () => {
  it("shows Administrator Console title for admin", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Administrator Console")).toBeInTheDocument()
    );
  });

  it("shows Manager's Dashboard title for manager", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Manager's Dashboard")).toBeInTheDocument()
    );
  });

  it("shows User Dashboard title for plain user", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("User Dashboard")).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Admin View Content
// ─────────────────────────────────────────────────────────────────────────────
describe("Admin view content", () => {
  it("renders system status strip", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("System Status")).toBeInTheDocument();
      expect(screen.getByText("🟢 Operational")).toBeInTheDocument();
    });
  });

  it("renders KPI cards for admin", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText("Failed Logins")).toBeInTheDocument();
      expect(screen.getByText("Audit Events")).toBeInTheDocument();
    });
  });

  it("renders System Traffic chart section", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("System Traffic")).toBeInTheDocument()
    );
  });

  it("renders System Health section", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("System Health")).toBeInTheDocument();
      expect(screen.getByText("CPU Usage")).toBeInTheDocument();
      expect(screen.getByText("Memory")).toBeInTheDocument();
    });
  });

  it("renders Audit Log section", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Audit Log")).toBeInTheDocument();
      expect(screen.getByText("Admin login")).toBeInTheDocument();
      expect(screen.getByText("Role updated")).toBeInTheDocument();
    });
  });

  it("renders Recent Activity table", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("Alice Chen")).toBeInTheDocument();
      expect(screen.getByText("Bob Reyes")).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Manager View Content
// ─────────────────────────────────────────────────────────────────────────────
describe("Manager view content", () => {
  it("renders manager KPI cards", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("Client NPS")).toBeInTheDocument();
      expect(screen.getByText("Critical Issues")).toBeInTheDocument();
    });
  });

  it("renders Revenue & Planning chart", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Revenue & Planning")).toBeInTheDocument()
    );
  });

  it("renders My Team section", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("My Team")).toBeInTheDocument();
      expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
      expect(screen.getByText("Mike Ross")).toBeInTheDocument();
    });
  });

  it("renders Recent Invoices table", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Recent Invoices")).toBeInTheDocument();
      expect(screen.getAllByText("TechCorp Ltd").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("#INV-2024")).toBeInTheDocument();
    });
  });

  it("renders Top Clients section", async () => {
    mockUser(MANAGER_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Top Clients")).toBeInTheDocument();
      expect(screen.getAllByText("Global Sols").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("$45k")).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. User View Content
// ─────────────────────────────────────────────────────────────────────────────
describe("User view content", () => {
  it("renders wallet balance cards", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Available Balance")).toBeInTheDocument();
      expect(screen.getByText("Monthly Spending")).toBeInTheDocument();
      expect(screen.getByText("Total Savings")).toBeInTheDocument();
    });
  });

  it("renders Spending Analysis section", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Spending Analysis")).toBeInTheDocument()
    );
  });

  it("renders Quick Actions buttons", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/send money/i)).toBeInTheDocument();
      expect(screen.getByText(/top up wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/freeze card/i)).toBeInTheDocument();
    });
  });

  it("renders Recent Transactions", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
      expect(screen.getByText("Netflix Subscription")).toBeInTheDocument();
      expect(screen.getByText("Salary Deposit")).toBeInTheDocument();
    });
  });

  it("renders Upcoming Bills section", async () => {
    mockUser(PLAIN_USER);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Upcoming Bills")).toBeInTheDocument();
      expect(screen.getByText("Internet Fiber")).toBeInTheDocument();
      expect(screen.getByText("Car Insurance")).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Navigation
// ─────────────────────────────────────────────────────────────────────────────
describe("Navigation", () => {
  it("renders UserManagement when User Management nav is clicked", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("User Management"));
    fireEvent.click(screen.getByText("User Management"));
    await waitFor(() =>
      expect(screen.getByTestId("user-management")).toBeInTheDocument()
    );
  });

  it("updates page title to User Management when nav clicked", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("User Management"));
    fireEvent.click(screen.getByText("User Management"));
    await waitFor(() =>
      expect(screen.getAllByText("User Management").length).toBeGreaterThanOrEqual(2)
    );
  });

  it("switches back to admin view when another nav item clicked", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("User Management"));
    fireEvent.click(screen.getByText("User Management"));
    await waitFor(() => screen.getByTestId("user-management"));
    fireEvent.click(screen.getByText("System Overview"));
    await waitFor(() =>
      expect(screen.queryByTestId("user-management")).not.toBeInTheDocument()
    );
  });

  it("opens external link for nav items with routes", async () => {
    mockUser(ADMIN_USER);
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => {});
    renderDashboard();
    await waitFor(() => screen.getByText("Account"));
    fireEvent.click(screen.getByText("Account"));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("/account"),
      "_blank"
    );
  });

  it("applies nav-active class to selected nav item", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("System Overview"));
    const navItem = screen.getByText("System Overview").closest("a");
    expect(navItem).toHaveClass("nav-active");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Identity Card
// ─────────────────────────────────────────────────────────────────────────────
describe("Identity card", () => {
  it("shows Identity & Access panel", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Identity & Access")).toBeInTheDocument()
    );
  });

  it("shows user email in identity card", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getAllByText("admin@example.com").length).toBeGreaterThanOrEqual(1)
    );
  });

  it("shows Online status in identity card", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Online")).toBeInTheDocument()
    );
  });

  it("shows Protected status with role privileges", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/admin privileges/i)).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Profile Dropdown
// ─────────────────────────────────────────────────────────────────────────────
describe("Profile dropdown", () => {
  it("opens profile dropdown on avatar click", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("Identity & Access"));
    clickAvatar();
    await waitFor(() =>
      expect(screen.getByText(/sign out/i)).toBeInTheDocument()
    );
  });

  it("shows user name in dropdown", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("Identity & Access"));
    clickAvatar();
    await waitFor(() =>
      expect(screen.getAllByText("Admin User").length).toBeGreaterThanOrEqual(1)
    );
  });

  it("calls logout when Sign out is clicked", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("Identity & Access"));
    clickAvatar();
    await waitFor(() => screen.getByText(/sign out/i));
    fireEvent.click(screen.getByText(/sign out/i));
    expect(logout).toHaveBeenCalled();
  });

  it("closes dropdown when clicking outside", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => screen.getByText("Identity & Access"));
    clickAvatar();
    await waitFor(() => screen.getByText(/sign out/i));
    fireEvent.mouseDown(document.body);
    await waitFor(() =>
      expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Session Timer
// ─────────────────────────────────────────────────────────────────────────────
describe("Session timer", () => {
  it("shows session timer when user has exp field", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(document.querySelector(".session-timer")).toBeInTheDocument()
    );
  });

  it("does not show timer when user has no exp field", async () => {
    const noExp = { ...ADMIN_USER };
    delete noExp.exp;
    mockUser(noExp);
    renderDashboard();
    await waitFor(() => screen.getByText("Identity & Access"));
    expect(document.querySelector(".session-timer")).not.toBeInTheDocument();
  });

  it("applies timer-urgent class when timeLeft <= 30", async () => {
    mockUser({ ...ADMIN_USER, exp: Math.floor(Date.now() / 1000) + 25 });
    renderDashboard();
    await waitFor(() =>
      expect(document.querySelector(".timer-urgent")).toBeInTheDocument()
    );
  });

  it("applies timer-low class when timeLeft <= 120", async () => {
    mockUser({ ...ADMIN_USER, exp: Math.floor(Date.now() / 1000) + 90 });
    renderDashboard();
    await waitFor(() =>
      expect(document.querySelector(".timer-low")).toBeInTheDocument()
    );
  });

  it("applies timer-ok class when timeLeft > 120", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(document.querySelector(".timer-ok")).toBeInTheDocument()
    );
  });

  it("calls logout when session expires", async () => {
    mockUser({ ...ADMIN_USER, exp: Math.floor(Date.now() / 1000) + 2 });
    renderDashboard();
    await waitFor(() => screen.getByText("Identity & Access"));
    act(() => { jest.advanceTimersByTime(3000); });
    await waitFor(() => expect(logout).toHaveBeenCalled());
  });

  it("calls refresh endpoint when timeLeft reaches 30", async () => {
    mockUser({ ...ADMIN_USER, exp: Math.floor(Date.now() / 1000) + 31 });
    renderDashboard();
    await waitFor(() => screen.getByText("Identity & Access"));
    act(() => { jest.advanceTimersByTime(1000); });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/refresh"),
        expect.objectContaining({ method: "POST" })
      )
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Topbar UI Elements
// ─────────────────────────────────────────────────────────────────────────────
describe("Topbar UI elements", () => {
  it("renders search box in topbar", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Search for something")
      ).toBeInTheDocument()
    );
  });

  it("renders settings and notification icon buttons", async () => {
    mockUser(ADMIN_USER);
    renderDashboard();
    await waitFor(() => {
      const buttons = document.querySelectorAll(".icon-circle-btn");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});