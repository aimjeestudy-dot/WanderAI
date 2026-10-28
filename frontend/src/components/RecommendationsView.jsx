import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, MapPin, Calendar, DollarSign, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { getRecommendations } from '../services/api';

const VIBE_CHIPS = ['Any Region', 'Europe Heritage', 'Tropical & Beach', 'East Asia', 'Latin America', 'Mountain Adventure'];

export default function RecommendationsView({ onSelectDestination }) {
  const [filters, setFilters] = useState({
    budget_level: 'Moderate',
    travel_style: 'Couple',
    duration_days: 5,
    interests: ['Culture & History', 'Food & Dining'],
    preferred_region_or_vibe: 'Any Region',
  });

  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sourceMessage, setSourceMessage] = useState('');
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRecommendations({
        budget_level: filters.budget_level,
        travel_style: filters.travel_style,
        duration_days: filters.duration_days,
        interests: filters.interests,
        preferred_region_or_vibe: filters.preferred_region_or_vibe === 'Any Region' ? '' : filters.preferred_region_or_vibe,
      });
      setRecommendations(res.recommendations || []);
      setIsDemoMode(res.is_demo_mode);
      setSourceMessage(res.source_message || '');
    } catch (err) {
      setError(err.message || 'Could not load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div style={{ marginTop: '10px' }}>
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Explore Destination Recommendations</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              Discover handcrafted suggestions tailored to your budget, style, and travel desires.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchRecommendations}
            disabled={isLoading}
          >
            <RefreshCw size={15} className={isLoading ? 'spinner' : ''} />
            <span>Refresh Suggestions</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="form-grid" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={15} color="var(--primary-400)" />
              <span>Budget Tier</span>
            </label>
            <select
              className="form-select"
              value={filters.budget_level}
              onChange={(e) => setFilters({ ...filters, budget_level: e.target.value })}
            >
              <option value="Budget">Budget ($)</option>
              <option value="Moderate">Moderate ($$)</option>
              <option value="Luxury">Luxury ($$$)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Compass size={15} color="var(--primary-400)" />
              <span>Travel Style</span>
            </label>
            <select
              className="form-select"
              value={filters.travel_style}
              onChange={(e) => setFilters({ ...filters, travel_style: e.target.value })}
            >
              <option value="Solo">Solo</option>
              <option value="Couple">Couple</option>
              <option value="Family">Family</option>
              <option value="Friends">Friends</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={15} color="var(--primary-400)" />
              <span>Duration ({filters.duration_days} days)</span>
            </label>
            <input
              type="range"
              min="2"
              max="14"
              value={filters.duration_days}
              className="form-input"
              style={{ cursor: 'pointer', padding: '8px' }}
              onChange={(e) => setFilters({ ...filters, duration_days: parseInt(e.target.value, 10) })}
            />
          </div>
        </div>

        {/* Vibe Chips */}
        <div style={{ marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '10px' }}>Preferred Vibe:</span>
          <div className="suggestion-chips" style={{ display: 'inline-flex' }}>
            {VIBE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`suggestion-chip ${filters.preferred_region_or_vibe === chip ? 'active' : ''}`}
                style={{
                  background: filters.preferred_region_or_vibe === chip ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  borderColor: filters.preferred_region_or_vibe === chip ? 'var(--primary-400)' : 'var(--glass-border)',
                }}
                onClick={() => setFilters({ ...filters, preferred_region_or_vibe: chip })}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={fetchRecommendations}
            disabled={isLoading}
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          >
            <Sparkles size={16} />
            <span>Update Recommendations</span>
          </button>
        </div>
      </div>

      {/* Info notice */}
      {sourceMessage && (
        <div className={`alert-banner ${isDemoMode ? 'warning' : 'info'}`} style={{ marginBottom: '20px' }}>
          <Sparkles size={16} />
          <span>{sourceMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      <div className="recommendations-grid">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="rec-card">
            <span className="rec-badge-score">{rec.match_score}% Match</span>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-accent)', fontSize: '0.85rem' }}>
                <MapPin size={14} />
                <span>{rec.country}</span>
              </div>
              <h3>{rec.destination}</h3>
              <p className="rec-tagline">"{rec.tagline}"</p>
              <p className="rec-why">{rec.why_it_fits}</p>

              <div style={{ marginBottom: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>Best Season:</strong> {rec.best_time_to_visit}
                <br />
                <strong>Daily Cost:</strong> <span style={{ color: 'var(--accent-emerald)' }}>{rec.estimated_daily_cost}</span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Top Highlights:
              </div>
              <ul className="rec-highlights">
                {rec.highlight_activities?.map((act, aIdx) => (
                  <li key={aIdx}>{act}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '10px' }}
              onClick={() =>
                onSelectDestination({
                  destination: `${rec.destination}, ${rec.country}`,
                  duration_days: filters.duration_days,
                  budget_level: filters.budget_level,
                  travel_style: filters.travel_style,
                  interests: filters.interests,
                })
              }
            >
              <span>Plan This Trip</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
