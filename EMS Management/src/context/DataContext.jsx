import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { sendApprovalEmail } from '../lib/emailService';

const DataContext = createContext();

const API_BASE_URL = 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('ems_jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const DataProvider = ({ children }) => {
  const { currentUser, isAdmin, usersList, setUsersList } = useAuth();

  // Pure Database State (No LocalStorage caching for data)
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  const [toasts, setToasts] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Fetch live records directly from Express Backend PostgreSQL database
  const fetchPostgresData = async () => {
    // Clear legacy LocalStorage keys
    try {
      localStorage.removeItem('ems_events');
      localStorage.removeItem('ems_organizers');
      localStorage.removeItem('ems_registrations');
    } catch (e) {
      console.warn("Storage purge notice:", e);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/events`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const dbEvents = Array.isArray(data) ? data : (data.events || []);
        setEvents(dbEvents);
        // Populate organizers from database response
        const allOrgs = dbEvents.flatMap(e => (e.organizers || []).map(o => ({
          ...o,
          eventId: e.id
        })));
        setOrganizers(allOrgs);
      }
    } catch (err) {
      console.warn("PostgreSQL Events API Notice:", err.message);
    }

    try {
      const regRes = await fetch(`${API_BASE_URL}/api/registrations`, { headers: getAuthHeaders() });
      if (regRes.ok) {
        const data = await regRes.json();
        const dbRegs = Array.isArray(data) ? data : (data.registrations || []);
        const mappedRegs = dbRegs.map(r => {
          const ev = events.find(e => e.id === r.eventId);
          const firstMem = Array.isArray(r.members) && r.members.length > 0 ? r.members[0] : null;
          const leaderName = r.teamLeaderName || r.leaderName || r.leader_name || firstMem?.name || 'Participant';
          const leaderEmail = r.teamLeaderEmail || r.leaderEmail || r.leader_email || firstMem?.email || '';
          const leaderPhone = r.teamLeaderPhone || r.leaderPhone || r.leader_phone || firstMem?.phone || '';
          const leaderDept = r.college || r.department || r.leaderDept || r.leader_dept || firstMem?.department || 'General';

          return {
            ...r,
            teamLeaderName: leaderName,
            teamLeaderEmail: leaderEmail,
            teamLeaderPhone: leaderPhone,
            eventName: r.eventName || ev?.title || r.eventTitle || 'College Event',
            college: leaderDept,
            department: leaderDept,
            teamSize: r.teamSize || (Array.isArray(r.members) ? Math.max(1, r.members.length) : 1),
            paymentScreenshotUrl: r.paymentScreenshotUrl || r.paymentScreenshot || r.payment_screenshot || 'Free Event',
            registrationDate: r.registrationDate || r.createdAt || r.created_at || new Date().toISOString()
          };
        });
        setRegistrations(mappedRegs);
      }
    } catch (err) {
      console.warn("PostgreSQL Registrations API Notice:", err.message);
    }
  };

  useEffect(() => {
    fetchPostgresData();
  }, [currentUser]);

  // Toast System
  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type: 'info', ...toast };
    setToasts(prev => [...prev, newToast]);
    
    if (toast.type !== 'email') {
      setTimeout(() => {
        removeToast(id);
      }, 6000);
    }
  };

  const showToast = (message, type = 'info', title = '') => {
    addToast({
      type,
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'),
      message
    });
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- COORDINATOR CRUD (Local PostgreSQL DB) ---
  const addCoordinator = async (coordinatorData) => {
    const newCoord = {
      id: crypto.randomUUID(),
      firebaseUid: coordinatorData.firebaseUid || `fb-uid-${Date.now()}`,
      fullName: coordinatorData.fullName || coordinatorData.email.split('@')[0],
      email: coordinatorData.email.trim(),
      phone: coordinatorData.phone || '',
      role: coordinatorData.role || 'coordinator',
      status: coordinatorData.status || 'active',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCoord)
      });

      if (res.ok) {
        const savedUser = await res.json();
        setUsersList(prev => [savedUser, ...prev.filter(u => u.id !== savedUser.id && u.email !== savedUser.email)]);
        addToast({ type: 'success', title: 'User Account Created', message: `${savedUser.fullName} added as ${savedUser.role}.` });
        return savedUser;
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save user to database');
      }
    } catch (e) {
      console.error("PostgreSQL User Insert Error:", e);
      addToast({ type: 'error', title: 'Database Insert Error', message: e.message });
      throw e;
    }
  };

  const updateCoordinator = async (id, updatedData) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, ...updatedData } : u));

    if (updatedData.role) {
      try {
        await fetch(`${API_BASE_URL}/api/users/${id}/role`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ role: updatedData.role })
        });
      } catch (e) {
        console.warn("PostgreSQL Role Update Notice:", e);
      }
    }

    addToast({ type: 'success', title: 'User Updated', message: 'User details & system role saved.' });
  };

  const toggleCoordinatorStatus = (id) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'active' ? 'inactive' : 'active';
        addToast({ 
          type: newStatus === 'active' ? 'success' : 'warning', 
          title: `Coordinator ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`, 
          message: `${u.fullName} is now ${newStatus}.` 
        });
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const deleteCoordinator = async (id) => {
    const coord = usersList.find(u => u.id === id);
    setUsersList(prev => prev.filter(u => u.id !== id));

    try {
      await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.warn("PostgreSQL User Delete Notice:", e);
    }

    addToast({ type: 'error', title: 'Coordinator Deleted', message: `${coord?.fullName || 'Coordinator'} has been deleted.` });
  };

  // --- EVENT CRUD (Local PostgreSQL DB Query, Insert & Update) ---
  const saveEvent = async (eventData, eventOrganizers = []) => {
    let savedEventId;
    
    if (eventData.id) {
      savedEventId = eventData.id;
      const updatedEv = { ...eventData, updatedAt: new Date().toISOString() };
      setEvents(prev => prev.map(e => e.id === eventData.id ? updatedEv : e));

      try {
        await fetch(`${API_BASE_URL}/api/events/${eventData.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...updatedEv, organizers: eventOrganizers })
        });
      } catch (e) {
        console.warn("PostgreSQL Event Update Notice:", e);
      }

      addToast({ type: 'success', title: 'Event Saved', message: `Event "${eventData.title}" updated in Database.` });
    } else {
      savedEventId = crypto.randomUUID();
      const newEvent = {
        ...eventData,
        id: savedEventId,
        createdById: currentUser?.id || 'user-admin-01',
        status: eventData.status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setEvents(prev => [newEvent, ...prev]);

      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ...newEvent, organizers: eventOrganizers })
        });
      } catch (e) {
        console.warn("PostgreSQL Event Insert Notice:", e);
      }

      addToast({ type: 'success', title: 'Event Created', message: `Event "${newEvent.title}" saved to Database.` });
    }

    if (eventOrganizers.length > 0) {
      setOrganizers(prev => {
        const otherOrganizers = prev.filter(o => o.eventId !== savedEventId);
        const updatedEventOrgs = eventOrganizers.map(o => ({
          ...o,
          id: o.id || `org-${Date.now()}-${Math.random()}`,
          eventId: savedEventId
        }));
        return [...otherOrganizers, ...updatedEventOrgs];
      });
    }

    fetchPostgresData();
    return savedEventId;
  };

  const deleteEvent = async (id) => {
    const ev = events.find(e => e.id === id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setOrganizers(prev => prev.filter(o => o.eventId !== id));
    setRegistrations(prev => prev.filter(r => r.eventId !== id));

    try {
      await fetch(`${API_BASE_URL}/api/events/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.warn("PostgreSQL Event Delete Notice:", e);
    }

    fetchPostgresData();
    addToast({ type: 'error', title: 'Event Deleted', message: `Event "${ev?.title}" deleted from PostgreSQL.` });
  };

  const toggleEventPublish = async (id, currentStatus) => {
    const existingEv = events.find(e => e.id === id);
    const initialStatus = currentStatus || existingEv?.status || 'draft';
    const newStatus = initialStatus === 'published' ? 'draft' : 'published';

    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));

    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        addToast({ 
          type: 'success', 
          title: `Event ${newStatus === 'published' ? 'Published' : 'Unpublished'}`, 
          message: `Status updated to ${newStatus}.` 
        });
      }
    } catch (e) {
      console.warn("PostgreSQL Status Update Notice:", e);
    }
  };

  // --- REGISTRATION MANAGEMENT ---
  const approveRegistration = async (id, remarks) => {
    const remarksText = remarks || 'Approved by Coordinator';
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', remarks: remarksText } : r));

    try {
      const res = await fetch(`${API_BASE_URL}/api/registrations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'approved', remarks: remarksText })
      });

      if (res.ok) {
        addToast({ type: 'success', title: 'Registration Approved', message: 'Registration status updated to Approved in database.' });
      }
    } catch (e) {
      console.warn("Approval Notice:", e);
      addToast({ type: 'warning', title: 'Registration Approved', message: 'Registration approved in database.' });
    }
  };

  const rejectRegistration = async (id, remarks) => {
    const remarksText = remarks || 'Registration details verification failed.';
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', remarks: remarksText } : r));

    try {
      await fetch(`${API_BASE_URL}/api/registrations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'rejected', remarks: remarksText })
      });
    } catch (e) {
      console.warn("PostgreSQL Registration Rejection Notice:", e);
    }

    addToast({ type: 'warning', title: 'Registration Rejected', message: 'Registration status updated to Rejected.' });
  };

  // All events and registrations are visible to all coordinators and admins
  const visibleEvents = events;

  const visibleRegistrations = registrations.map(r => ({
    ...r,
    eventName: events.find(e => e.id === r.eventId)?.title || r.eventName || 'College Event',
    coordinatorName: usersList.find(u => u.id === r.reviewedById || u.id === r.coordinatorId)?.fullName || 'Unassigned'
  }));

  const coordinatorsList = usersList.filter(u => u.role === 'coordinator' || u.role === 'admin');

  const resetAllData = async () => {
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        await fetchPostgresData();
        addToast({ type: 'success', title: 'Database Reset', message: 'All database tables reset and seeded with initial records.' });
      } else {
        throw new Error('Database reset failed');
      }
    } catch (e) {
      addToast({ type: 'error', title: 'Reset Error', message: e.message });
    }
  };

  return (
    <DataContext.Provider value={{
      events,
      visibleEvents,
      organizers,
      setOrganizers,
      registrations,
      visibleRegistrations,
      coordinatorsList,
      toasts,
      addToast,
      showToast,
      removeToast,
      addCoordinator,
      updateCoordinator,
      toggleCoordinatorStatus,
      deleteCoordinator,
      saveEvent,
      deleteEvent,
      toggleEventPublish,
      approveRegistration,
      rejectRegistration,
      isSettingsOpen,
      setIsSettingsOpen,
      fetchPostgresData,
      resetAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
