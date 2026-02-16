import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../api/auth";
import "./Dashboard.css";


function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        // If backend returns wrapped response, handle it safely
        const actualUser = data?.data ? data.data : data;
        setUser(actualUser);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Not authenticated");
        setIsLoading(false);
      });
  }, []);

  // expiration time logic

  useEffect(() => {
    if (!user?.exp) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = user.exp - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [user]);

useEffect(() => {
  if (!timeLeft) return;

  if (timeLeft === 30) {
    fetch("http://localhost:8000/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => getCurrentUser())
      .then((data) => {
        const actualUser = data?.data ? data.data : data;
        setUser(actualUser);
      })
      .catch(() => {
        logout();
      });
  }
}, [timeLeft]);


  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="dashboard-error">
        <div className="error-card">
          <h2 className="error-title">{error || "User not found"}</h2>
          <p className="error-message">
            Please log in to access your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="bg-decoration deco-1"></div>
      <div className="bg-decoration deco-2"></div>
      <div className="bg-decoration deco-3"></div>

      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <h1 className="brand-logo">
              <span className="brand-bank">Bank</span>
              <span className="brand-dash">Dash</span>
            </h1>
            <span className="brand-tagline">Digital Wallet</span>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
          {timeLeft !== null && (
            <p style={{ color: "gray", fontSize: "14px" }}>
              Session expires in: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
            </p>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-card">
            <div className="avatar-container">
              <div className="avatar">
                <span className="avatar-text">
                  {user?.name
                    ? user.name.charAt(0).toUpperCase()
                    : user?.preferred_username
                      ? user.preferred_username.charAt(0).toUpperCase()
                      : "U"}
                </span>
              </div>
              <div className="avatar-ring"></div>
            </div>

            <div className="welcome-content">
              <h2 className="welcome-title">Welcome back,</h2>
              <h1 className="welcome-name">
                {user?.name || user?.preferred_username || "User"}
              </h1>
              <p className="welcome-subtitle">
                Here's what's happening with your account today.
              </p>
            </div>
          </div>
        </section>

        {/* User Info Cards */}
        <section className="info-grid">
          {/* Email */}
          <div className="info-card card-email">
            <div className="card-content">
              <h3 className="card-label">Email Address</h3>
              <p className="card-value">{user?.email || "Not available"}</p>
            </div>
          </div>

          {/* Username */}
          <div className="info-card card-username">
            <div className="card-content">
              <h3 className="card-label">Username</h3>
              <p className="card-value">
                {user?.preferred_username || "Not available"}
              </p>
            </div>
          </div>

          {/* Roles */}
          <div className="info-card card-roles">
            <div className="card-content">
              <h3 className="card-label">Access Roles</h3>
              <div className="roles-container">
                {user?.roles?.length > 0 ? (
                  user.roles.map((role, index) => (
                    <span key={index} className="role-badge">
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="role-badge">No roles assigned</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
