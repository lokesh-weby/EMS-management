import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Edit3, 
  Trash2, 
  Lock,
  Power,
  RefreshCw,
  Mail,
  Phone,
  Loader2,
  Tag
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { auth, createSecondaryUser } from '../lib/firebase';

export const CoordinatorManagement = ({ externalModalOpen, setExternalModalOpen }) => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    coordinatorsList, 
    addCoordinator, 
    updateCoordinator, 
    toggleCoordinatorStatus, 
    deleteCoordinator,
    showToast 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [usersList, setUsersList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsersPage = async (pageToLoad = 1) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoadingPage(true);

    try {
      const token = localStorage.getItem('ems_jwt_token');
      const queryParams = new URLSearchParams({
        page: pageToLoad,
        limit: 5,
        ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {})
      });

      const res = await fetch(`http://localhost:5000/api/users?${queryParams.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const usersArray = data.users || (Array.isArray(data) ? data : []);
        setUsersList(prev => pageToLoad === 1 ? usersArray : [...prev, ...usersArray]);
        setHasMore(data.hasMore ?? false);
        setPage(pageToLoad + 1);
      }
    } catch (err) {
      console.warn("Failed to load paginated users:", err);
    } finally {
      loadingRef.current = false;
      setIsLoadingPage(false);
    }
  };

  // Re-fetch users from DB whenever debounced search or filter options change
  useEffect(() => {
    loadUsersPage(1);
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current && page > 1) {
        loadUsersPage(page);
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, hasMore]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoord, setEditingCoord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const handleOpen = () => handleOpenCreate();
    window.addEventListener('open-add-coordinator', handleOpen);
    return () => window.removeEventListener('open-add-coordinator', handleOpen);
  }, []);
  const [deletingId, setDeletingId] = useState(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('coordinator');
  const [firebaseUid, setFirebaseUid] = useState('');
  const [status, setStatus] = useState('active');

  // Handle opening form
  const handleOpenCreate = () => {
    setEditingCoord(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('coordinator');
    setFirebaseUid('');
    setStatus('active');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coord) => {
    setEditingCoord(coord);
    setFullName(coord.fullName);
    setEmail(coord.email);
    setPassword('');
    setPhone(coord.phone);
    setRole(coord.role || 'coordinator');
    setFirebaseUid(coord.firebaseUid || '');
    setStatus(coord.status);
    setFormError('');
    setIsModalOpen(true);
  };

  // Sync external modal trigger
  useEffect(() => {
    if (externalModalOpen) {
      handleOpenCreate();
      if (setExternalModalOpen) setExternalModalOpen(false);
    }
  }, [externalModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      let activeUid = firebaseUid;

      if (!editingCoord) {
        // 1. Create account directly in live Firebase Authentication
        if (password) {
          try {
            const fbUser = await createSecondaryUser(email.trim(), password);
            if (fbUser) activeUid = fbUser.uid;
            showToast('Registered user account!', 'success');
          } catch (fbErr) {
            console.warn("Firebase Auth User Creation Notice:", fbErr);
            if (fbErr.code === 'auth/email-already-in-use') {
              setFormError('This email is already registered.');
              setSubmitting(false);
              return;
            } else if (fbErr.code === 'auth/weak-password') {
              setFormError('Password should be at least 6 characters long.');
              setSubmitting(false);
              return;
            } else {
              activeUid = `fb-uid-${Date.now()}`;
            }
          }
        } else if (!activeUid) {
          activeUid = `fb-uid-${Date.now()}`;
        }

        // 2. Add User with assigned role (Coordinator or Admin)
        const savedUser = await addCoordinator({ 
          fullName, 
          email: email.trim(), 
          phone, 
          role: role || 'coordinator',
          firebaseUid: activeUid, 
          status 
        });
        if (savedUser) {
          setUsersList(prev => [savedUser, ...prev.filter(u => u.id !== savedUser.id && u.email !== savedUser.email)]);
        } else {
          loadUsersPage(1);
        }
        showToast(`User registered as ${role === 'admin' ? 'System Administrator' : 'Coordinator'}!`, 'success');
      } else {
        // Update existing user profile & role
        await updateCoordinator(editingCoord.id, { 
          fullName, 
          email: email.trim(), 
          phone, 
          role: role || 'coordinator',
          firebaseUid: activeUid, 
          status 
        });
        setUsersList(prev => prev.map(u => u.id === editingCoord.id ? { 
          ...u, 
          fullName, 
          email: email.trim(), 
          phone, 
          role: role || 'coordinator', 
          status 
        } : u));
        showToast('User profile & assigned role updated!', 'success');
      }

      setSubmitting(false);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save user details.');
      setSubmitting(false);
    }
  };

  // Filter & Search Logic (Excludes currently logged in user)
  const sourceList = usersList.length > 0 ? usersList : coordinatorsList;
  const filtered = sourceList.filter(c => {
    if (currentUser && c.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
      return false;
    }
    const matchesSearch = (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesRole = roleFilter === 'all' || (c.role || 'coordinator') === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const displayedData = filtered;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Event Coordinators & User Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage system accounts, assign Administrator or Coordinator roles & RBAC credentials.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Event Coordinator
        </button>
      </div>

      {/* Controls Bar: Search & Status / Role Filter */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="coordinator">Coordinators Only</option>
              <option value="admin">Administrators Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Coordinator / User Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Assigned Role (System Access)</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                displayedData.map(coord => (
                  <tr key={coord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-bold flex items-center justify-center border border-slate-200">
                        {coord.fullName[0]}
                      </div>
                      <div>
                        <span>{coord.fullName}</span>
                        <div className="text-[10px] font-mono text-slate-400 font-normal">{coord.firebaseUid || 'Synced'}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {coord.email}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        (coord.role || 'coordinator') === 'admin'
                          ? 'bg-indigo-900 text-white shadow-xs'
                          : 'bg-slate-900 text-white'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {(coord.role || 'coordinator') === 'admin' ? 'Administrator' : 'Coordinator'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {coord.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge status={coord.status} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {/* Status Toggle Button */}
                      <button
                        onClick={() => {
                          toggleCoordinatorStatus(coord.id);
                          setUsersList(prev => prev.map(u => u.id === coord.id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          coord.status === 'active'
                            ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100'
                            : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={coord.status === 'active' ? "Deactivate User Account" : "Activate User Account"}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(coord)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit User Details & Role"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingId(coord.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* IntersectionObserver Sentinel & Infinite Scroll Footer */}
        <div ref={sentinelRef} className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Showing <strong className="text-slate-900">{displayedData.length}</strong> of <strong className="text-slate-900">{filtered.length}</strong> user profiles
          </span>
          {hasMore && (
            <span className="text-indigo-600 font-bold animate-pulse">Loading more accounts...</span>
          )}
        </div>
      </div>

      {/* Create / Edit Coordinator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoord ? 'Edit User Details & Role' : 'Create New User Account'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Prof. Ananya Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address (Firebase Auth Account) *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ananya.cse@college.edu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          {!editingCoord && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password (Min 6 Characters) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Assigned Role (System Access) *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            >
              <option value="coordinator">Coordinator (Manage Events & Registrations)</option>
              <option value="admin">System Administrator (Full Authority & Settings)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">System Administrators have full authority to manage users, events, and system settings.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98123 45678"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingCoord ? 'Save Changes' : 'Create User Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            const idToDelete = deletingId;
            setDeletingId(null);
            await deleteCoordinator(idToDelete);
            setUsersList(prev => prev.filter(u => u.id !== idToDelete));
          }
        }}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user account? This action cannot be undone."
        confirmText="Delete User"
        confirmStyle="danger"
      />
    </div>
  );
};
