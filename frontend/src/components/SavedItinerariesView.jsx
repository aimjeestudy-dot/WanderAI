import React, { useState } from 'react';
import { Bookmark, MapPin, Clock, Calendar, Trash2, ExternalLink, Search, FileText, Check, Database } from 'lucide-react';
import { deleteItinerary, updateItineraryNotes } from '../services/api';

export default function SavedItinerariesView({
  savedList,
  onSelectItinerary,
  onRefreshList,
  storageType,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [deletePendingId, setDeletePendingId] = useState(null);

  const filtered = savedList.filter((item) => {
    const dest = (item.destination || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return dest.includes(query) || title.includes(query);
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved itinerary?')) {
      return;
    }
    setDeletePendingId(id);
    try {
      await deleteItinerary(id);
      await onRefreshList();
    } catch (err) {
      alert(`Error deleting itinerary: ${err.message}`);
    } finally {
      setDeletePendingId(null);
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      await updateItineraryNotes(id, noteText);
      setEditingNotesId(null);
      await onRefreshList();
    } catch (err) {
      alert(`Error updating notes: ${err.message}`);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2>My Saved Itineraries</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              Access, update notes, or manage your stored trips.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="status-pill">
              <Database size={14} color={storageType === 'supabase' ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
              <span>Storage: {storageType === 'supabase' ? 'Supabase Cloud' : 'Local File Persistence'}</span>
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '16px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search saved trips by destination or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Bookmark size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No Saved Itineraries Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 0' }}>
            {searchTerm
              ? 'No trips matched your search filter.'
              : 'You have not saved any travel plans yet. Generate a trip and click "Save Itinerary" to store it here.'}
          </p>
        </div>
      ) : (
        <div className="saved-grid">
          {filtered.map((item) => {
            const itin = item.data || item;
            const isEditing = editingNotesId === item.id;

            return (
              <div key={item.id} className="saved-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span className="day-badge" style={{ fontSize: '0.75rem' }}>
                      {item.duration_days} Days • {item.budget_level}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginTop: '10px', marginBottom: '6px' }}>{item.title}</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-accent)', fontSize: '0.88rem', marginBottom: '10px' }}>
                    <MapPin size={14} />
                    <span>{item.destination}</span>
                  </div>

                  {item.estimated_total_cost && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '10px' }}>
                      Est. Total: {item.estimated_total_cost}
                    </div>
                  )}

                  {/* Notes Area */}
                  {isEditing ? (
                    <div style={{ marginTop: '12px' }}>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: '60px', fontSize: '0.85rem' }}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add flight numbers, hotel tips..."
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => setEditingNotesId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleSaveNotes(item.id)}
                        >
                          <Check size={14} />
                          <span>Save Note</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setEditingNotesId(item.id);
                        setNoteText(item.notes || '');
                      }}
                      title="Click to edit notes"
                    >
                      <FileText size={13} style={{ display: 'inline', marginRight: '5px' }} />
                      <span>{item.notes ? item.notes : 'Click here to add personal flight/hotel notes...'}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletePendingId === item.id}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => onSelectItinerary(itin)}
                  >
                    <span>View Itinerary</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
