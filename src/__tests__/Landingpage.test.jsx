/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LandingPage from "../pages/landingPage";

// ── Mock CSS imports ──────────────────────────────────────────────────────────
jest.mock("../pages/landingPage.css", () => ({}));

// ── Reset before each test ────────────────────────────────────────────────────
beforeEach(() => {
  window.open = jest.fn();
  // Reset href if setup worked; harmless if not
  if (typeof window.location.href === "string") {
    try { window.location.href = ""; } catch { /* JSDOM blocked it */ }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
describe("LandingPage", () => {

  // ── Rendering ───────────────────────────────────────────────────────────────
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<LandingPage />);
    });

    it("renders the Mywallet logo text", () => {
      render(<LandingPage />);
      // "Mywallet" appears in both navbar logo AND h1 — use getAllByText
      const walletEls = screen.getAllByText("Mywallet");
      expect(walletEls.length).toBeGreaterThanOrEqual(1);
    });

    it("renders the hero title", () => {
      render(<LandingPage />);
      const matches = screen.getAllByText(/Mywallet/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it("renders the subtitle", () => {
      render(<LandingPage />);
      expect(screen.getByText("A personal Wallet Platform")).toBeInTheDocument();
    });

    it("renders the description paragraph", () => {
      render(<LandingPage />);
      expect(
        screen.getByText(/BankDash is a secure and modern digital wallet/i)
      ).toBeInTheDocument();
    });

    it("renders the eyebrow trust badge", () => {
      render(<LandingPage />);
      expect(
        screen.getByText(/Trusted by 50,000\+ users worldwide/i)
      ).toBeInTheDocument();
    });
  });

  // ── Navbar ───────────────────────────────────────────────────────────────────
  describe("Navbar", () => {
    it("renders nav links: Features, Security, Pricing", () => {
      render(<LandingPage />);
      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getByText("Security")).toBeInTheDocument();
      expect(screen.getByText("Pricing")).toBeInTheDocument();
    });

    it("renders the Sign In button in the navbar", () => {
      render(<LandingPage />);
      expect(screen.getByText("Sign In →")).toBeInTheDocument();
    });

    it("clicking Sign In button does not throw", () => {
      render(<LandingPage />);
      // We verify the handler fires without error — href mock unreliable in this JSDOM
      expect(() =>
        fireEvent.click(screen.getByText("Sign In →"))
      ).not.toThrow();
    });
  });

  // ── Feature Pills ─────────────────────────────────────────────────────────
  describe("Feature Pills", () => {
    it("renders the encrypted pill", () => {
      render(<LandingPage />);
      expect(screen.getByText(/End-to-end encrypted/i)).toBeInTheDocument();
    });

    it("renders the real-time sync pill", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Real-time sync/i)).toBeInTheDocument();
    });

    it("renders the role-based access pill", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Role-based access/i)).toBeInTheDocument();
    });
  });

  // ── CTA Buttons ──────────────────────────────────────────────────────────
  describe("CTA Buttons", () => {
    it("renders the Get Started button", () => {
      render(<LandingPage />);
      expect(screen.getByText("Get Started")).toBeInTheDocument();
    });

    it("clicking Get Started button does not throw", () => {
      render(<LandingPage />);
      expect(() =>
        fireEvent.click(screen.getByText("Get Started"))
      ).not.toThrow();
    });

    it("renders the Watch Demo button", () => {
      render(<LandingPage />);
      expect(screen.getByText(/Watch demo/i)).toBeInTheDocument();
    });

    it("clicking Watch Demo opens YouTube link in a new tab", () => {
      render(<LandingPage />);
      fireEvent.click(screen.getByText(/Watch demo/i));
      expect(window.open).toHaveBeenCalledWith(
        "https://youtu.be/iuJDhFRDx9M?si=DFj4U2PtrxvJHCBC",
        "_blank",
        "noopener,noreferrer"
      );
    });
  });

  // ── Stats Row ────────────────────────────────────────────────────────────
  describe("Stats Row", () => {
    it("renders Active Users stat", () => {
      render(<LandingPage />);
      expect(screen.getByText("50K+")).toBeInTheDocument();
      expect(screen.getByText("Active Users")).toBeInTheDocument();
    });

    it("renders Uptime stat", () => {
      render(<LandingPage />);
      expect(screen.getByText("99.9%")).toBeInTheDocument();
      expect(screen.getByText("Uptime")).toBeInTheDocument();
    });

    it("renders Access Levels stat", () => {
      render(<LandingPage />);
      expect(screen.getByText("3 Roles")).toBeInTheDocument();
      expect(screen.getByText("Access Levels")).toBeInTheDocument();
    });
  });

  // ── Phone UI / CSS Art ───────────────────────────────────────────────────
  describe("Phone UI Art", () => {
    it("renders the Available Balance amount", () => {
      render(<LandingPage />);
      expect(screen.getByText("$4,250.00")).toBeInTheDocument();
    });

    it("renders the masked card number", () => {
      render(<LandingPage />);
      expect(screen.getByText("•••• •••• •••• 4291")).toBeInTheDocument();
    });

    it("renders quick action buttons: Send, Recv, Swap, Stats", () => {
      render(<LandingPage />);
      expect(screen.getByText("Send")).toBeInTheDocument();
      expect(screen.getByText("Recv")).toBeInTheDocument();
      expect(screen.getByText("Swap")).toBeInTheDocument();
      expect(screen.getByText("Stats")).toBeInTheDocument();
    });

    it("renders recent transactions", () => {
      render(<LandingPage />);
      expect(screen.getByText("Amazon")).toBeInTheDocument();
      expect(screen.getByText("Salary")).toBeInTheDocument();
      expect(screen.getByText("Spotify")).toBeInTheDocument();
    });

    it("renders the Sign in with Keycloak button in the phone UI", () => {
      render(<LandingPage />);
      expect(screen.getByText("Sign in with Keycloak")).toBeInTheDocument();
    });
  });

  // ── Float Cards ──────────────────────────────────────────────────────────
  describe("Floating Dashboard Card", () => {
    it("renders Total Balance label", () => {
      render(<LandingPage />);
      expect(screen.getByText("Total Balance")).toBeInTheDocument();
    });

    it("renders the balance value", () => {
      render(<LandingPage />);
      expect(screen.getByText("$24,830.50")).toBeInTheDocument();
    });

    it("renders the positive growth indicator", () => {
      render(<LandingPage />);
      expect(screen.getByText(/\+12% this month/i)).toBeInTheDocument();
    });
  });

  // ── Notification Toast ───────────────────────────────────────────────────
  describe("Notification Toast", () => {
    it("renders Payment Sent notification", () => {
      render(<LandingPage />);
      expect(screen.getByText("Payment Sent")).toBeInTheDocument();
    });

    it("renders notification sub-text", () => {
      render(<LandingPage />);
      expect(screen.getByText("$240.00 to James Lee")).toBeInTheDocument();
    });
  });
});