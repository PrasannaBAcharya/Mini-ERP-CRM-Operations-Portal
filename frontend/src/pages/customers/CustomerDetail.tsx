import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer, addNote } from '../../api/customers';
import { Customer } from '../../types';
import { useToast } from '../../components/Toast';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const { showToast } = useToast();

  const fetchCustomer = async () => {
    try {
      if (id) {
        const res = await getCustomer(id);
        setCustomer(res);
      }
    } catch (err) {
      showToast('Failed to fetch customer details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    try {
      await addNote(id, newNote);
      setNewNote('');
      showToast('Note added', 'success');
      fetchCustomer();
    } catch (err) {
      showToast('Failed to add note', 'error');
    }
  };

  if (loading) return <div className="loading-center"><div className="loading-spinner"></div></div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
          <h2>{customer.name}</h2>
          <span className={`badge badge-${customer.status === 'ACTIVE' ? 'success' : customer.status === 'LEAD' ? 'warning' : 'gray'}`}>
            {customer.status}
          </span>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Contact Info</h3>
          <p><strong>Mobile:</strong> {customer.mobile}</p>
          <p><strong>Email:</strong> {customer.email || '-'}</p>
          <p><strong>Address:</strong> {customer.address}</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Business Info</h3>
          <p><strong>Business Name:</strong> {customer.businessName || '-'}</p>
          <p><strong>GST Number:</strong> {customer.gstNumber || '-'}</p>
          <p><strong>Type:</strong> {customer.type}</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Follow-up Notes</h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          {customer.notes && customer.notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {customer.notes.map(note => (
                <div key={note.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {new Date(note.createdAt).toLocaleString()} by {note.createdBy}
                  </div>
                  <div>{note.note}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1rem' }}>No notes yet</div>
          )}
        </div>

        <form onSubmit={handleAddNote}>
          <div className="form-group">
            <textarea 
              className="form-textarea" 
              placeholder="Add a new note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary" disabled={!newNote.trim()}>Add Note</button>
        </form>
      </div>
    </div>
  );
};

export default CustomerDetail;
