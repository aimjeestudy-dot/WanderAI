import React, { useState } from 'react';
import {
  Bookmark,
  Share2,
  CheckCircle2,
  MapPin,
  Clock,
  DollarSign,
  Lightbulb,
  Utensils,
  ShieldCheck,
  Luggage,
  Sparkles,
  ArrowLeft,
  FileText,
} from 'lucide-react';

export default function ItineraryView({ itinerary, onSave, onBack, isSaving }) {
  const [userNotes, setUserNotes] = useState(itinerary.notes || '');
  const [checkedItems, setCheckedItems] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState(1);

  if (!itinerary) return null;

  const toggleChecklist = (index) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyMarkdown = () => {
    let md = `# ${itinerary.title}\n\n`;
    md += `**Destination:** ${itinerary.destination}\n`;
    md += `**Duration:** ${itinerary.duration_days} Days | **Style:** ${itinerary.travel_style} | **Budget:** ${itinerary.budget_level}\n`;
    md += `**Estimated Cost:** ${itinerary.estimated_total_cost}\n\n`;
    md += `## Overview\n${itinerary.summary}\n\n`;

    itinerary.days?.forEach((day) => {
      md += `### Day ${day.day_number}: ${day.theme}\n`;
      day.activities?.forEach((act) => {
        md += `- **${act.time_of_day} - ${act.title}** (${act.location})\n`;
        md += `  ${act.description}\n`;
        md += `  *Est. Cost:* ${act.estimated_cost} | *Tip:* ${act.insider_tip || 'N/A'}\n\n`;
      });
      if (day.local_food_recommendations?.length) {
        md += `  *Local Food Highlights:* ${day.local_food_recommendations.join(', ')}\n\n`;
      }
    });

    if (itinerary.packing_checklist?.length) {
      md += `## Packing Checklist\n`;
      itinerary.packing_checklist.forEach((item) => {
        md += `- [ ] ${item}\n`;
      });
      md += `\n`;
    }

    if (itinerary.safety_and_transport_tips?.length) {
      md += `## Safety & Transport Tips\n`;
      itinerary.safety_and_transport_tips.forEach((tip) => {
        md += `- ${tip}\n`;
      });
    }

    navigator.clipboard.writeText(md).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  return (
    <div className="glass-card" style={{ marginTop: '20px' }}>
      {/* Top action navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <button type="button" className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Edit Preferences</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyMarkdown}
            title="Copy formatted markdown to clipboard"
          >
            <Share2 size={16} />
            <span>{copySuccess ? 'Copied to Clipboard!' : 'Share / Copy Markdown'}</span>
          </button>

          <button
            id="btn-save-itinerary"
            type="button"
            className="btn-primary"
            onClick={() => onSave(itinerary, userNotes)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner"></span>
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Bookmark size={16} />
                <span>Save Itinerary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Transparency Badge */}
      {itinerary.is_demo_mode ? (
        <div className="alert-banner warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            <span>
              <strong>Local Demo Mode:</strong> This itinerary was generated using the local template engine. To enable real-time Gemini AI, add <code>GEMINI_API_KEY</code> to <code>backend/.env</code>.
            </span>
          </div>
        </div>
      ) : (
        <div className="alert-banner success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            <span>
              <strong>Google Gemini AI:</strong> Curated in real-time using Gemini model.
            </span>
          </div>
        </div>
      )}

      {/* Itinerary Header */}
      <div className="itinerary-header">
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{itinerary.title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          {itinerary.summary}
        </p>

        <div className="itinerary-meta-chips">
          <div className="meta-chip">
            <MapPin size={15} color="var(--primary-400)" />
            <span>Destination: <strong>{itinerary.destination}</strong></span>
          </div>
          <div className="meta-chip">
            <Clock size={15} color="var(--primary-400)" />
            <span>Duration: <strong>{itinerary.duration_days} Days</strong></span>
          </div>
          <div className="meta-chip">
            <DollarSign size={15} color="var(--accent-emerald)" />
            <span>Est. Cost: <strong>{itinerary.estimated_total_cost}</strong></span>
          </div>
          <div className="meta-chip">
            <span>Style: <strong>{itinerary.travel_style} ({itinerary.number_of_travelers} travelers)</strong></span>
          </div>
          <div className="meta-chip">
            <span>Budget: <strong>{itinerary.budget_level}</strong></span>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
        <button
          className={`tab-btn ${activeDayTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveDayTab('all')}
        >
          All Days ({itinerary.days?.length || 0})
        </button>
        {itinerary.days?.map((day) => (
          <button
            key={day.day_number}
            className={`tab-btn ${activeDayTab === day.day_number ? 'active' : ''}`}
            onClick={() => setActiveDayTab(day.day_number)}
          >
            Day {day.day_number}
          </button>
        ))}
      </div>

      {/* Timeline Days */}
      <div className="timeline-container">
        {itinerary.days
          ?.filter((day) => activeDayTab === 'all' || activeDayTab === day.day_number)
          .map((day) => (
            <div key={day.day_number} className="day-card">
              <span className="day-badge">Day {day.day_number}</span>
              <h3 className="day-theme">{day.theme}</h3>

              <div className="activity-list">
                {day.activities?.map((act, idx) => {
                  const periodClass = (act.time_of_day || 'morning').toLowerCase();
                  return (
                    <div key={idx} className="activity-item">
                      <div className="activity-period">
                        <span className={`period-badge ${periodClass}`}>
                          {act.time_of_day}
                        </span>
                        <span className="activity-cost">{act.estimated_cost}</span>
                      </div>

                      <div className="activity-details">
                        <h4>{act.title}</h4>
                        <p className="activity-desc">{act.description}</p>

                        <div className="activity-location">
                          <MapPin size={13} />
                          <span>{act.location}</span>
                        </div>

                        {act.insider_tip && (
                          <div className="activity-tip">
                            <Lightbulb size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                            <span><strong>Insider Tip:</strong> {act.insider_tip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Local Food for Day */}
              {day.local_food_recommendations?.length > 0 && (
                <div style={{ marginTop: '18px', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <Utensils size={15} />
                    <span>Local Culinary Specialties</span>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {day.local_food_recommendations.map((food, fIdx) => (
                      <li key={fIdx} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                        🍽️ {food}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Practical Extras: Packing & Safety */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
        {/* Packing Checklist */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Luggage size={18} color="var(--primary-400)" />
            <h4 style={{ fontSize: '1.1rem' }}>Smart Packing Checklist</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {itinerary.packing_checklist?.map((item, idx) => (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  color: checkedItems[idx] ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: checkedItems[idx] ? 'line-through' : 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[idx]}
                  onChange={() => toggleChecklist(idx)}
                  style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Safety & Local Transport */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
            <h4 style={{ fontSize: '1.1rem' }}>Safety & Local Transit</h4>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {itinerary.safety_and_transport_tips?.map((tip, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* User Notes Section */}
      <div style={{ marginTop: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <FileText size={16} color="var(--primary-400)" />
          <h4 style={{ fontSize: '1rem' }}>Personal Notes & Flight Details</h4>
        </div>
        <textarea
          className="form-textarea"
          placeholder="Add flight numbers, hotel booking confirmation, or personal reminders..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onSave(itinerary, userNotes)}
            disabled={isSaving}
          >
            <Bookmark size={15} />
            <span>Save Notes with Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
}
