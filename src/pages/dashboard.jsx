import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../api/auth";
import "./Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Not authenticated");
        setIsLoading(false);
      });
  }, []);

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

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-card">
          <svg className="error-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#FF6B6B"/>
          </svg>
          <h2 className="error-title">{error}</h2>
          <p className="error-message">Please log in to access your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Background decorations */}
      <div className="bg-decoration deco-1"></div>
      <div className="bg-decoration deco-2"></div>
      <div className="bg-decoration deco-3"></div>

      {/* Header */}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-card">
            <div className="avatar-container">
              <div className="avatar">
                <span className="avatar-text">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="avatar-ring"></div>
            </div>
            
            <div className="welcome-content">
              <h2 className="welcome-title">Welcome back,</h2>
              <h1 className="welcome-name">{user.name}</h1>
              <p className="welcome-subtitle">Here's what's happening with your account today.</p>
            </div>
          </div>
        </section>

        {/* User Info Cards */}
        <section className="info-grid">
          {/* Email Card */}
          <div className="info-card card-email">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
            </div>
            <div className="card-content">
              <h3 className="card-label">Email Address</h3>
              <p className="card-value">{user.email}</p>
            </div>
          </div>

          {/* Username Card */}
          <div className="info-card card-username">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
            </div>
            <div className="card-content">
              <h3 className="card-label">Username</h3>
              <p className="card-value">{user.preferred_username}</p>
            </div>
          </div>

          {/* Roles Card */}
          <div className="info-card card-roles">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
              </svg>
            </div>
            <div className="card-content">
              <h3 className="card-label">Access Roles</h3>
              <div className="roles-container">
                {user.roles.map((role, index) => (
                  <span key={index} className="role-badge">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon stat-icon-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Active Status</p>
                <p className="stat-value">Online</p>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon stat-icon-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Last Login</p>
                <p className="stat-value">Just now</p>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon stat-icon-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-info">
                <p className="stat-label">Security</p>
                <p className="stat-value">Protected</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;