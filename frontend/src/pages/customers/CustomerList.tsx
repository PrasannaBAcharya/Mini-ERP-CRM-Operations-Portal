import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer } from '../../api/customers';
import { Customer } from '../../types';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', businessName: '', gstNumber: '',
    type: 'RETAIL', address: '', status: 'LEAD', followUpDate: ''
  });

  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ search, status, page });
      setCustomers(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      showToast('Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [search, status, page]);

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || '',
        businessName: customer.businessName || '',
        gstNumber: customer.gstNumber || '',
        type: customer.type,
        address: customer.address,
        status: customer.status,
        followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '', mobile: '', email: '', businessName: '', gstNumber: '',
        type: 'RETAIL', address: '', status: 'LEAD', followUpDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined
      };
      
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
        showToast('Customer updated successfully', 'success');
      } else {
        await createCustomer(payload);
        showToast('Customer created successfully', 'success');
      }
      closeModal();
      fetchCustomers();
    } catch (err) {
      showToast('Failed to save customer', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <button className="btn btn-primary" onClick={() => openModal()}>Add Customer</button>
        )}
      </div>

      <div className="card">
        <div className="filters-bar">
          <input 
            type="text" 
            placeholder="Search name, mobile, business..." 
            className="form-input" 
            style={{ width: '300px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="form-select" 
            style={{ width: '150px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="LEAD">LEAD</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="loading-spinner"></div></div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Business</th>
                    <th>Mobile</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.businessName || '-'}</td>
                      <td>{c.mobile}</td>
                      <td>{c.type}</td>
                      <td>
                        <span className={`badge badge-${c.status === 'ACTIVE' ? 'success' : c.status === 'LEAD' ? 'warning' : 'gray'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <Link to={`/customers/${c.id}`} className="btn btn-sm btn-secondary">View</Link>
                          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
                            <button className="btn btn-sm btn-secondary" onClick={() => openModal(c)}>Edit</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr><td colSpan={6} className="empty-state">No customers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="btn" onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="stats-grid" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile *</label>
                    <input className="form-input" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input className="form-input" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input className="form-input" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="RETAIL">RETAIL</option>
                      <option value="WHOLESALE">WHOLESALE</option>
                      <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="LEAD">LEAD</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input type="date" className="form-input" value={formData.followUpDate} onChange={e => setFormData({...formData, followUpDate: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <textarea className="form-textarea" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
