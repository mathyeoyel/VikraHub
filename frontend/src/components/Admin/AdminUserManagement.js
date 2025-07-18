import React, { useState, useEffect } from 'react';
import api from '../../api';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_joined');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/');
      const userData = response.data.results || response.data || [];
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || 
                         (filterType === 'active' && user.is_active) ||
                         (filterType === 'inactive' && !user.is_active) ||
                         (filterType === 'staff' && user.is_staff) ||
                         (filterType === 'freelancer' && user.user_type === 'freelancer') ||
                         (filterType === 'client' && user.user_type === 'client');

    return matchesSearch && matchesFilter;
  });

  const handleUserAction = async (userId, action) => {
    try {
      let endpoint = '';
      let method = 'patch';
      let data = {};

      switch (action) {
        case 'activate':
          endpoint = `/users/${userId}/`;
          data = { is_active: true };
          break;
        case 'deactivate':
          endpoint = `/users/${userId}/`;
          data = { is_active: false };
          break;
        case 'make_staff':
          endpoint = `/users/${userId}/`;
          data = { is_staff: true };
          break;
        case 'remove_staff':
          endpoint = `/users/${userId}/`;
          data = { is_staff: false };
          break;
        case 'delete':
          endpoint = `/users/${userId}/`;
          method = 'delete';
          break;
        default:
          return;
      }

      if (method === 'delete') {
        await api.delete(endpoint);
      } else {
        await api.patch(endpoint, data);
      }

      await fetchUsers();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} user. Please try again.`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await handleUserAction(userId, action);
      }
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <div className="user-stats">
          <span>Total: {users.length}</span>
          <span>Active: {users.filter(u => u.is_active).length}</span>
          <span>Staff: {users.filter(u => u.is_staff).length}</span>
        </div>
      </div>

      <div className="user-controls">
        <div className="search-filter-section">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-search"
          />
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="user-filter"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="staff">Staff</option>
            <option value="freelancer">Freelancers</option>
            <option value="client">Clients</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="user-sort"
          >
            <option value="date_joined">Join Date</option>
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="last_login">Last Login</option>
          </select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedUsers.length} users selected</span>
            <button onClick={() => handleBulkAction('activate')} className="bulk-btn activate">
              Activate
            </button>
            <button onClick={() => handleBulkAction('deactivate')} className="bulk-btn deactivate">
              Deactivate
            </button>
            <button onClick={() => handleBulkAction('delete')} className="bulk-btn delete">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="users-table">
        <div className="table-header">
          <div className="select-all">
            <input
              type="checkbox"
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onChange={selectAllUsers}
            />
          </div>
          <div>User</div>
          <div>Type</div>
          <div>Status</div>
          <div>Joined</div>
          <div>Actions</div>
        </div>

        {filteredUsers.map(user => (
          <div key={user.id} className="table-row">
            <div className="select-user">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => toggleUserSelection(user.id)}
              />
            </div>
            
            <div className="user-info" onClick={() => openUserModal(user)}>
              <div className="user-avatar">
                {user.first_name?.[0] || user.username?.[0] || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.username}
                </div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>

            <div className="user-type">
              <span className={`type-badge ${user.user_type || 'client'}`}>
                {user.user_type || 'Client'}
              </span>
              {user.is_staff && <span className="staff-badge">Staff</span>}
              {user.is_superuser && <span className="superuser-badge">Admin</span>}
            </div>

            <div className="user-status">
              <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="user-joined">
              {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
            </div>

            <div className="user-actions">
              <button 
                onClick={() => openUserModal(user)}
                className="action-btn view"
                title="View Details"
              >
                👁️
              </button>
              
              <button
                onClick={() => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate')}
                className={`action-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                title={user.is_active ? 'Deactivate' : 'Activate'}
              >
                {user.is_active ? '🚫' : '✅'}
              </button>

              {!user.is_superuser && (
                <button
                  onClick={() => handleUserAction(user.id, user.is_staff ? 'remove_staff' : 'make_staff')}
                  className={`action-btn ${user.is_staff ? 'remove-staff' : 'make-staff'}`}
                  title={user.is_staff ? 'Remove Staff' : 'Make Staff'}
                >
                  {user.is_staff ? '👤' : '👨‍💼'}
                </button>
              )}

              <button
                onClick={() => handleUserAction(user.id, 'delete')}
                className="action-btn delete"
                title="Delete User"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showUserModal && selectedUser && (
        <div className="user-modal-overlay" onClick={closeUserModal}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button onClick={closeUserModal} className="close-btn">×</button>
            </div>
            
            <div className="modal-content">
              <div className="user-profile-section">
                <div className="profile-avatar">
                  {selectedUser.first_name?.[0] || selectedUser.username?.[0] || 'U'}
                </div>
                <div className="profile-info">
                  <h4>{selectedUser.first_name && selectedUser.last_name 
                    ? `${selectedUser.first_name} ${selectedUser.last_name}` 
                    : selectedUser.username}</h4>
                  <p>{selectedUser.email}</p>
                </div>
              </div>

              <div className="user-details-grid">
                <div className="detail-item">
                  <label>Username:</label>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="detail-item">
                  <label>User Type:</label>
                  <span>{selectedUser.user_type || 'Client'}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={selectedUser.is_active ? 'active' : 'inactive'}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Staff:</label>
                  <span>{selectedUser.is_staff ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-item">
                  <label>Joined:</label>
                  <span>{selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Last Login:</label>
                  <span>{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
