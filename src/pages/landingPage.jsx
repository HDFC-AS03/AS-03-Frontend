import { useState } from "react";
import "./landingPage.css";

const API_BASE = "http://localhost:8000";

function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 7;

  const handleGetStarted = () => {
    // Redirect directly to backend login endpoint
    window.location.href = `${API_BASE}/login`;
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-left">
          <h1 className="landing-title">
            <span className="brand">BankDash</span>
          </h1>
          <p className="landing-subtitle">An Online Wallet Platform</p>

          <p className="landing-description">
            BankDash is a secure and modern digital wallet platform that helps
            users manage transactions, monitor finances, and access role-based
            dashboards seamlessly.
          </p>

          <button className="get-started-btn" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>

        <div className="landing-right">
          <div className="phone-card">
            <div className="card-header">
              <div className="user-avatar">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="#9B8FDB" />
                  <path
                    d="M6 18C6 15.7909 7.79086 14 10 14H14C16.2091 14 18 15.7909 18 18V20H6V18Z"
                    fill="#9B8FDB"
                  />
                </svg>
              </div>
            </div>

            <div className="card-content">
              <div className="card-lines">
                <div className="line line-long"></div>
                <div className="line line-short"></div>
              </div>

              <div className="dots-container">
                {[...Array(totalSlides)].map((_, index) => (
                  <div
                    key={index}
                    className={`dot ${
                      index === currentSlide ? "active" : ""
                    }`}
                    onClick={() => setCurrentSlide(index)}
                  ></div>
                ))}
              </div>

              <div className="card-button"></div>
            </div>
          </div>

          <div className="person-working">
            <div className="person-head"></div>
            <div className="person-body"></div>
            <div className="laptop"></div>
            <div className="chair"></div>
          </div>

          <div className="shield-icon">
            <svg width="120" height="140" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6V12C4 16.55 7.16 20.74 12 22C16.84 20.74 20 16.55 20 12V6L12 2Z"
                fill="url(#shield-gradient)"
                fillOpacity="0.9"
              />
              <path
                d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"
                fill="white"
              />
              <defs>
                <linearGradient
                  id="shield-gradient"
                  x1="4"
                  y1="2"
                  x2="20"
                  y2="22"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#7B9BFF" />
                  <stop offset="1" stopColor="#5B7FE8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
