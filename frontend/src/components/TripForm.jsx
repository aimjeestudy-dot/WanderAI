import React, { useState } from 'react';
import { MapPin, Calendar, DollarSign, Users, Sparkles, AlertCircle, Compass, Heart } from 'lucide-react';

const POPULAR_DESTINATIONS = [
  'Tokyo, Japan',
  'Kyoto, Japan',
  'Rome, Italy',
  'Paris, France',
  'Reykjavik, Iceland',
  'Oaxaca, Mexico',
  'Barcelona, Spain',
  'Bali, Indonesia',
];

const AVAILABLE_INTERESTS = [
  'Culture & History',
  'Food & Dining',
  'Nature & Adventure',
  'Art & Museums',
  'Beaches & Coastal',
  'Nightlife & Music',
  'Shopping & Boutiques',
  'Photography & Architecture',
  'Wellness & Spas',
  'Coffee & Cafe Culture',
];

export default function TripForm({ initialData, onSubmit, isLoading, onExploreRecommendations }) {
  const [formData, setFormData] = useState({
    destination: initialData?.destination || '',
    duration_days: initialData?.duration_days || 4,
    budget_level: initialData?.budget_level || 'Moderate',
    approximate_budget: initialData?.approximate_budget || '',
    travel_style: initialData?.travel_style || 'Couple',
    number_of_travelers: initialData?.number_of_travelers || 2,
    interests: initialData?.interests || ['Culture & History', 'Food & Dining'],
    pace: initialData?.pace || 'Balanced',
    dietary_restrictions: initialData?.dietary_restrictions || '',
    additional_notes: initialData?.additional_notes || '',
  });

  const [errors, setErrors] = useState({});

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      const nextInterests = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: nextInterests };
    });
    // Clear interest error if resolved
    if (errors.interests) {
      setErrors((prev) => ({ ...prev, interests: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.destination || formData.destination.trim().length < 2) {
      newErrors.destination = 'Please enter a destination (e.g. "Kyoto, Japan").';
    }
    if (!formData.duration_days || formData.duration_days < 1 || formData.duration_days > 30) {
      newErrors.duration_days = 'Trip duration must be between 1 and 30 days.';
    }
    if (!formData.number_of_travelers || formData.number_of_travelers < 1) {
      newErrors.number_of_travelers = 'Must have at least 1 traveler.';
    }
    if (!formData.interests || formData.interests.length === 0) {
      newErrors.interests = 'Please pick at least one travel interest to tailor the trip.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Plan Your Dream Trip</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Customize your preferences to generate an authentic day-by-day travel plan.
          </p>
        </div>
        {onExploreRecommendations && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onExploreRecommendations}
            style={{ fontSize: '0.85rem' }}
          >
            <Compass size={16} />
            <span>Not sure where to go? Explore Recommendations</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
        <div className="form-grid">
          {/* Destination */}
          <div className="form-group full-width">
            <label className="form-label" htmlFor="input-destination">
              <MapPin size={16} color="var(--primary-400)" />
              <span>Destination</span>
            </label>
            <input
              id="input-destination"
              type="text"
              className="form-input"
              placeholder="e.g. Kyoto, Japan or Amalfi Coast, Italy"
              value={formData.destination}
              onChange={(e) => {
                setFormData({ ...formData, destination: e.target.value });
                if (errors.destination) setErrors({ ...errors, destination: null });
              }}
            />
            {errors.destination && (
              <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {errors.destination}
              </span>
            )}
            <div className="suggestion-chips">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick picks:</span>
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => {
                    setFormData({ ...formData, destination: dest });
                    if (errors.destination) setErrors({ ...errors, destination: null });
                  }}
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>

          {/* Duration in Days */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-duration">
              <Calendar size={16} color="var(--primary-400)" />
              <span>Trip Duration</span>
              <span className="form-hint">({formData.duration_days} days)</span>
            </label>
            <input
              id="input-duration"
              type="range"
              min="1"
              max="14"
              value={formData.duration_days}
              className="form-input"
              style={{ cursor: 'pointer', padding: '8px' }}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value, 10) })}
            />
            {errors.duration_days && (
              <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>{errors.duration_days}</span>
            )}
          </div>

          {/* Number of Travelers */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-travelers">
              <Users size={16} color="var(--primary-400)" />
              <span>Number of Travelers</span>
            </label>
            <input
              id="input-travelers"
              type="number"
              min="1"
              max="20"
              className="form-input"
              value={formData.number_of_travelers}
              onChange={(e) => setFormData({ ...formData, number_of_travelers: parseInt(e.target.value, 10) || 1 })}
            />
            {errors.number_of_travelers && (
              <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>{errors.number_of_travelers}</span>
            )}
          </div>

          {/* Budget Level */}
          <div className="form-group">
            <label className="form-label" htmlFor="select-budget">
              <DollarSign size={16} color="var(--primary-400)" />
              <span>Budget Tier</span>
            </label>
            <select
              id="select-budget"
              className="form-select"
              value={formData.budget_level}
              onChange={(e) => setFormData({ ...formData, budget_level: e.target.value })}
            >
              <option value="Budget">Budget ($ - Hostels, street eats & transit)</option>
              <option value="Moderate">Moderate ($$ - Boutique stays & bistro meals)</option>
              <option value="Luxury">Luxury ($$$ - 5-star hotels & private tours)</option>
            </select>
          </div>

          {/* Travel Style */}
          <div className="form-group">
            <label className="form-label" htmlFor="select-style">
              <Compass size={16} color="var(--primary-400)" />
              <span>Travel Style</span>
            </label>
            <select
              id="select-style"
              className="form-select"
              value={formData.travel_style}
              onChange={(e) => setFormData({ ...formData, travel_style: e.target.value })}
            >
              <option value="Solo">Solo Traveler</option>
              <option value="Couple">Romantic / Couple</option>
              <option value="Family">Family with Kids</option>
              <option value="Friends">Group of Friends</option>
              <option value="Business">Business & Leisure</option>
            </select>
          </div>

          {/* Pace */}
          <div className="form-group">
            <label className="form-label" htmlFor="select-pace">
              <Heart size={16} color="var(--primary-400)" />
              <span>Preferred Pace</span>
            </label>
            <select
              id="select-pace"
              className="form-select"
              value={formData.pace}
              onChange={(e) => setFormData({ ...formData, pace: e.target.value })}
            >
              <option value="Relaxed">Relaxed (1-2 main activities, lots of downtime)</option>
              <option value="Balanced">Balanced (Steady pace, scenic highlights)</option>
              <option value="Fast-paced">Fast-paced (Action packed, see everything)</option>
            </select>
          </div>

          {/* Specific Budget Target (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-approx-budget">
              <span>Target Budget (Optional)</span>
            </label>
            <input
              id="input-approx-budget"
              type="text"
              className="form-input"
              placeholder="e.g. $1,500 USD or €1,200"
              value={formData.approximate_budget}
              onChange={(e) => setFormData({ ...formData, approximate_budget: e.target.value })}
            />
          </div>

          {/* Travel Interests (Multi-select) */}
          <div className="form-group full-width">
            <label className="form-label">
              <Sparkles size={16} color="var(--primary-400)" />
              <span>Interests & Activities (Pick at least 1)</span>
            </label>
            <div className="interest-tag-grid">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-tag ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
            {errors.interests && (
              <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <AlertCircle size={14} /> {errors.interests}
              </span>
            )}
          </div>

          {/* Dietary & Special Requests */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-diet">
              <span>Dietary Restrictions (Optional)</span>
            </label>
            <input
              id="input-diet"
              type="text"
              className="form-input"
              placeholder="e.g. Vegetarian, Halal, Gluten-free, Seafood lover"
              value={formData.dietary_restrictions}
              onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-notes">
              <span>Special Requests / Must-See Sights</span>
            </label>
            <input
              id="input-notes"
              type="text"
              className="form-input"
              placeholder="e.g. Want to visit Mount Fuji, avoid steep stairs"
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            id="btn-generate-itinerary"
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ minWidth: '220px' }}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Generating with AI...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Itinerary</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
