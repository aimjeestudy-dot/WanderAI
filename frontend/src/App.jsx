import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TripForm from './components/TripForm';
import ItineraryView from './components/ItineraryView';
import RecommendationsView from './components/RecommendationsView';
import SavedItinerariesView from './components/SavedItinerariesView';
import StatusPanel from './components/StatusPanel';
import { getSystemStatus, generateItinerary, saveItinerary, listItineraries } from './services/api';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('plan');
  const [systemStatus, setSystemStatus] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [savedList, setSavedList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [prefilledTripData, setPrefilledTripData] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadInitialData = async () => {
    setIsConnecting(true);
    try {
      const statusRes = await getSystemStatus();
      setSystemStatus(statusRes);
      setBackendError(null);
    } catch (e) {
      console.warn('System status check:', e.message);
      setBackendError(e.message);
    } finally {
      setIsConnecting(false);
    }

    try {
      const savedRes = await listItineraries();
      setSavedList(savedRes || []);
    } catch (e) {
      console.warn('Could not load saved list:', e.message);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleGenerate = async (formData) => {
    setIsLoading(true);
    try {
      const itinerary = await generateItinerary(formData);
      setCurrentItinerary(itinerary);
      showToast('success', `Itinerary created for ${itinerary.destination}!`);
    } catch (err) {
      showToast('error', `Generation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItinerary = async (itinerary, notes) => {
    setIsSaving(true);
    try {
      const res = await saveItinerary(itinerary, notes);
      showToast('success', res.message || 'Itinerary saved successfully!');
      // Refresh saved list
      const updatedList = await listItineraries();
      setSavedList(updatedList || []);
      if (res.record) {
        setCurrentItinerary((prev) => ({
          ...prev,
          id: res.itinerary_id,
          notes: notes,
        }));
      }
    } catch (err) {
      showToast('error', `Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectRecommendation = (recData) => {
    setPrefilledTripData(recData);
    setCurrentItinerary(null);
    setActiveTab('plan');
    showToast('info', `Loaded ${recData.destination} into trip planner!`);
  };

  const handleViewSavedItinerary = (itinerary) => {
    setCurrentItinerary(itinerary);
    setActiveTab('plan');
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        savedCount={savedList.length}
        systemStatus={systemStatus}
        backendError={backendError}
        isConnecting={isConnecting}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className={`alert-banner ${toast.type}`} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Sparkles size={16} />}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Welcome Banner (only shown on 'plan' tab when no active generated itinerary) */}
      {activeTab === 'plan' && !currentItinerary && (
        <section className="hero-banner">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>AI-Driven Personalized Travel</span>
          </div>
          <h2 className="hero-title">
            Your Next Journey, <span>Curated to Perfection</span>
          </h2>
          <p className="hero-subtitle">
            Craft authentic, day-by-day itineraries with morning, afternoon, and evening sights,
            local cuisine secrets, and packing essentials tailored to your style.
          </p>
        </section>
      )}

      {/* Tab 1: Plan Trip */}
      {activeTab === 'plan' && (
        <div>
          {currentItinerary ? (
            <ItineraryView
              itinerary={currentItinerary}
              onSave={handleSaveItinerary}
              onBack={() => setCurrentItinerary(null)}
              isSaving={isSaving}
            />
          ) : (
            <TripForm
              initialData={prefilledTripData}
              onSubmit={handleGenerate}
              isLoading={isLoading}
              onExploreRecommendations={() => setActiveTab('recommendations')}
            />
          )}
        </div>
      )}

      {/* Tab 2: Explore Recommendations */}
      {activeTab === 'recommendations' && (
        <RecommendationsView onSelectDestination={handleSelectRecommendation} />
      )}

      {/* Tab 3: Saved Itineraries */}
      {activeTab === 'saved' && (
        <SavedItinerariesView
          savedList={savedList}
          onSelectItinerary={handleViewSavedItinerary}
          onRefreshList={async () => {
            const list = await listItineraries();
            setSavedList(list || []);
          }}
          storageType={systemStatus?.storage_type || 'local_storage'}
        />
      )}

      {/* Tab 4: System Status & Settings */}
      {activeTab === 'status' && (
        <StatusPanel
          systemStatus={systemStatus}
          backendError={backendError}
          onStatusUpdated={(newStatus) => {
            setSystemStatus(newStatus);
            setBackendError(null);
          }}
        />
      )}
    </div>
  );
}
