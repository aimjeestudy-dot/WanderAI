import React, { useState } from 'react';
import { Shield, Sparkles, Database, RefreshCw, Key, ExternalLink, CheckCircle2, AlertTriangle, Code } from 'lucide-react';
import { getSystemStatus } from '../services/api';

export default function StatusPanel({ systemStatus, onStatusUpdated }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getSystemStatus();
      onStatusUpdated(res);
    } catch (e) {
      alert('Could not refresh status: ' + e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isGeminiReady = systemStatus?.gemini_configured;
  const isSupabaseReady = systemStatus?.supabase_configured;

  return (
    <div className="settings-section" style={{ marginTop: '10px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Environment & Integrations Status</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              Check your Google Gemini AI and Supabase database connections.
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
