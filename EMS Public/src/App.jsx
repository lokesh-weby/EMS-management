import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EventDetailModal } from './components/EventDetailModal';
import { RegistrationModal } from './components/RegistrationModal';

import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { StatusCheckPage } from './pages/StatusCheckPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

export default function App() {
  // Modal States
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);
  const [selectedRegisterEvent, setSelectedRegisterEvent] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleOpenRegister = (ev) => {
    setSelectedRegisterEvent(ev);
    setIsRegisterModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      <div>
        {/* Navigation Header */}
        <Header />

        {/* Route Views */}
        <main>
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  onRegisterClick={handleOpenRegister} 
                  onViewDetailClick={(ev) => setSelectedDetailEvent(ev)} 
                />
              } 
            />

            <Route 
              path="/events" 
              element={
                <EventsPage 
                  onRegisterClick={handleOpenRegister} 
                  onViewDetailClick={(ev) => setSelectedDetailEvent(ev)} 
                />
              } 
            />

            <Route 
              path="/register" 
              element={
                <EventsPage 
                  onRegisterClick={handleOpenRegister} 
                  onViewDetailClick={(ev) => setSelectedDetailEvent(ev)} 
                />
              } 
            />

            <Route path="/status" element={<StatusCheckPage />} />
            <Route path="/check-status" element={<StatusCheckPage />} />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Footer */}
      <Footer />

      {/* Event Details Modal */}
      <EventDetailModal
        isOpen={Boolean(selectedDetailEvent)}
        onClose={() => setSelectedDetailEvent(null)}
        event={selectedDetailEvent}
        onRegisterClick={handleOpenRegister}
      />

      {/* Multi-Step Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        event={selectedRegisterEvent}
      />
    </div>
  );
}
