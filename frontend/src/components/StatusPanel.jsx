import React, { useState } from 'react';
import { Sparkles, Database, RefreshCw, Key, ExternalLink, AlertTriangle, Link2, Check } from 'lucide-react';
import { getSystemStatus, resolveApiBase, setApiBaseOverride } from '../services/api';

export default function StatusPanel({ systemStatus, backendError, onStatusUpdated }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [customUrl, setCustomUrl] = useState(() => {
    return typeof window !== 'undefined' ? window.localStorage.getItem('WANDERAI_API_BASE') || '' : '';
  });
  const [urlSavedMessage, setUrlSavedMessage] = useState(null);

  const currentApiBase = resolveApiBase();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await getSystemStatus();
      onStatusUpdated(res);
    } catch (e) {
      setRefreshError(e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveCustomUrl = async (e) => {
    e.preventDefault();
    setApiBaseOverride(customUrl);
    setUrlSavedMessage('Backend URL updated! Checking connection...');
    await handleRefresh();
    setTimeout(() => setUrlSavedMessage(null), 4000);
  };

  const handleResetUrl = async () => {
    setCustomUrl('');
    setApiBaseOverride(null);
    setUrlSavedMessage('Reset to default backend URL.');
    await handleRefresh();
    setTimeout(() => setUrlSavedMessage(null), 4000);
  };

  const isGeminiReady = systemStatus?.gemini_configured;
  const isSupabaseReady = systemStatus?.supabase_configured;
  const isOffline = Boolean(backendError || refreshError || !systemStatus);

  return (
    <div className="settings-section" style={{ marginTop: '10px' }}>
      {/* Backend Connectivity Banner if offline */}
      {isOffline && (
        <div className="alert-banner error" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <strong>Backend Connection Notice</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.9 }}>
            Target Backend: <code>{currentApiBase}</code>
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>
            {refreshError || backendError || 'Backend service is currently unreachable. If using Render free tier, the initial cold start can take 50-90 seconds to wake up.'}
          </p>
        </div>
      )}

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Environment & Integrations Status</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              Active Backend Endpoint: <code>{currentApiBase}</code>
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinner' : ''} />
            <span>Re-Check Status</span>
          </button>
        </div>

        {/* Runtime Backend URL Override Form */}
        <div style={{ marginTop: '18px', padding: '14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <form onSubmit={handleSaveCustomUrl} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link2 size={15} />
              <span>Configure Live Backend URL (Override):</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="e.g. https://your-render-service.onrender.com"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{ flex: 1, minWidth: '260px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input, rgba(0,0,0,0.2))', color: '#fff', fontSize: '0.88rem' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.88rem' }} disabled={isRefreshing}>
                Apply & Test
              </button>
              {customUrl && (
                <button type="button" className="btn-secondary" onClick={handleResetUrl} style={{ padding: '8px 14px', fontSize: '0.88rem' }} disabled={isRefreshing}>
                  Reset
                </button>
              )}
            </div>
            {urlSavedMessage && (
              <span style={{ fontSize: '0.82rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> {urlSavedMessage}
              </span>
            )}
          </form>
        </div>

        {/* Status Metrics */}
        <div className="status-card-grid" style={{ marginTop: '24px' }}>
          <div className={`status-metric-card ${isGeminiReady ? 'ready' : 'demo'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color={isGeminiReady ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
              <h3 style={{ fontSize: '1.1rem' }}>Google Gemini AI</h3>
            </div>
            <div style={{ fontSize: '0.9rem', color: isGeminiReady ? '#6ee7b7' : '#fde68a', fontWeight: 600 }}>
              {isGeminiReady ? '✓ Active & Connected' : '● Demo Template Mode'}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Model: <code>{systemStatus?.gemini_model || 'gemini-2.5-flash'}</code>
            </p>
          </div>

          <div className={`status-metric-card ${isSupabaseReady ? 'ready' : 'demo'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={18} color={isSupabaseReady ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
              <h3 style={{ fontSize: '1.1rem' }}>Database Storage</h3>
            </div>
            <div style={{ fontSize: '0.9rem', color: isSupabaseReady ? '#6ee7b7' : '#fde68a', fontWeight: 600 }}>
              {isSupabaseReady ? '✓ Supabase Cloud Active' : '● Local JSON Storage'}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {isSupabaseReady
                ? 'Synced to Supabase PostgreSQL table.'
                : 'Data persists safely in backend/data/saved_itineraries.json.'}
            </p>
          </div>
        </div>
      </div>

      {/* Guide: How to connect Gemini */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Key size={20} color="var(--primary-400)" />
          <h3>1. Connect Google Gemini API (Free)</h3>
        </div>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          To enable live, personalized AI responses from Gemini:
        </p>
        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            Get a free API key at{' '}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary-400)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              Google AI Studio <ExternalLink size={12} />
            </a>.
          </li>
          <li>
            Open the file <code>backend/.env</code> in your code editor.
          </li>
          <li>
            Set your key:
            <div className="code-snippet" style={{ marginTop: '6px' }}>
              GEMINI_API_KEY=your_actual_gemini_api_key_here
            </div>
          </li>
          <li>Click the <strong>"Re-Check Status"</strong> button above!</li>
        </ol>
      </div>

      {/* Guide: How to connect Supabase */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Database size={20} color="var(--accent-emerald)" />
          <h3>2. Connect Supabase Cloud Database (Free)</h3>
        </div>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          To sync your itineraries to the cloud database:
        </p>
        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            Create a free project at{' '}
            <a
              href="https://supabase.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-emerald)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              Supabase.com <ExternalLink size={12} />
            </a>.
          </li>
          <li>
            In Supabase Dashboard, go to <strong>SQL Editor</strong>, open <code>backend/supabase_schema.sql</code>, paste the SQL and click <strong>Run</strong>.
          </li>
          <li>
            Go to <strong>Project Settings → API</strong> and copy your <strong>Project URL</strong> and <strong>anon public API key</strong>.
          </li>
          <li>
            Add them to <code>backend/.env</code>:
            <div className="code-snippet" style={{ marginTop: '6px' }}>
              SUPABASE_URL=https://your-project.supabase.co<br />
              SUPABASE_ANON_KEY=your_supabase_anon_key_here
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
