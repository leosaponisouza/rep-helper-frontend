// src/context/EventsContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useEvents } from '../hooks/useEvents';
import { 
  Event, 
  EventFormData, 
  InvitationStatus, 
  EventFilterType,
  EventStats
} from '../services/events';

// Define the context type
interface EventsContextType {
  events: Event[];
  allEvents: Event[];
  loading: boolean;
  error: string | null;
  fetchEvents: (filter?: EventFilterType) => Promise<void>;
  refreshEvents: (specificFilter?: EventFilterType) => Promise<boolean>;
  applyFilter: (filter: EventFilterType, events?: Event[]) => void;
  createEvent: (eventData: EventFormData) => Promise<Event>;
  updateEvent: (eventId: number, updateData: Partial<EventFormData>) => Promise<Event>;
  deleteEvent: (eventId: number) => Promise<boolean>;
  respondToInvite: (eventId: number | string, userId: string, status: InvitationStatus) => Promise<Event>;
  updateInvitationStatus: (eventId: number | string, userId: string, status: InvitationStatus) => Promise<Event>;
  inviteUsers: (eventId: number, userIds: string[]) => Promise<any>;
  formatEventDate: (dateString?: string, includeTime?: boolean) => string;
  getCurrentUserEventStatus: (event: Event) => InvitationStatus | null;
  getInvitationStats: (event: Event) => EventStats;
  isCurrentUserCreator: (event: Event) => boolean;
  filterType: EventFilterType;
  getEventById: (eventId: string | number) => Promise<Event | null>;
}

// Create the context with a default value
const EventsContext = createContext<EventsContextType | undefined>(undefined);

// Provider component
export const EventsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const eventsHook = useEvents();
  
  return (
    <EventsContext.Provider value={eventsHook}>
      {children}
    </EventsContext.Provider>
  );
};

// Custom hook to use the events context
export const useEventsContext = (): EventsContextType => {
  const context = useContext(EventsContext);
  
  if (context === undefined) {
    throw new Error('useEventsContext must be used within an EventsProvider');
  }
  
  return context;
};

export { Event, EventFilterType };
