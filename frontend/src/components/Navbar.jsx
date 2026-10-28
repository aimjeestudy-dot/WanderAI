import React from 'react';
import { Compass, Sparkles, Bookmark, Settings as SettingsIcon, Globe } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, savedCount, systemStatus }) {
  const isGeminiReady = systemStatus?.gemini_configured;
  const isSupabaseReady = systemStatus?.supabase_configured;

  return (
    <header className="navbar">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('plan')}>
        <div className="brand-icon">
          <Compass size={24} color="#ffffff" />
        </div>
        <div className="brand-text">
          <h1>WanderAI</h1>
          <span className="brand-tagline">Personalized AI Travel Curator</span>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Main Navigation">
        <button
          id="nav-tab-plan"
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          <Sparkles size={16} />
          <span>Plan Trip</span>
        </button>

        <button
          id="nav-tab-recommendations"
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Globe size={16} />
          <span>Explore</span>
        </button>

        <button
          id="nav-tab-saved"
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={16} />
          <span>Saved</span>
          {savedCount > 0 && <span className="badge-count">{savedCount}</span>}
        </button>

        <button
          id="nav-tab-status"
          className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          <SettingsIcon size={16} />
          <span>Status</span>
        </button>
      </nav>

      <div
        className="status-pill"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('status')}
        title="Click to view AI & Database configuration"
      >
        <span className={`status-dot ${isGeminiReady ? 'active' : 'demo'}`}></span>
        <span>{isGeminiReady ? 'Gemini AI' : 'Demo AI'}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span className={`status-dot ${isSupabaseReady ? 'active' : 'demo'}`}></span>
        <span>{isSupabaseReady ? 'Supabase' : 'Local DB'}</span>
      </div>
    </header>
  );
}
