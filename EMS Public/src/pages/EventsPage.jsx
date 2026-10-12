import React from 'react';
import { EventsSection } from '../components/EventsSection';

export const EventsPage = ({ onRegisterClick, onViewDetailClick }) => {
  return (
    <div className="py-8 space-y-6 animate-fade-in">
      {/* Events Section Catalog */}
      <EventsSection
        onRegisterClick={onRegisterClick}
        onViewDetailClick={onViewDetailClick}
      />
    </div>
  );
};
