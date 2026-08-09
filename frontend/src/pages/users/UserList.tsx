import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser } from '../../api/users';
import { User } from '../../types';
import { useToast } from '../../components/Toast';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers(page);
      setUsers(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        showToast('User deleted', 'success');
        fetchUsers();
      } catch (err) {
        showToast('Failed to delete user', 'error');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Users</h2>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="loading-spinner"></div></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge badge-gray">{u.role}</span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
