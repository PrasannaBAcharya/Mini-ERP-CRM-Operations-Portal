import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getStockHistory } from '../../api/products';
import { Product, StockMovement } from '../../types';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      if (id) {
        const prod = await getProduct(id);
        setProduct(prod);
        
        const histRes = await getStockHistory(id, page);
        setHistory(histRes.data);
        setTotalPages(histRes.totalPages);
      }
    } catch (err) {
      showToast('Failed to fetch product details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, page]);

  if (loading) return <div className="loading-center"><div className="loading-spinner"></div></div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
          <h2>{product.name}</h2>
          <span className="badge badge-gray">{product.sku}</span>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Product Info</h3>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Unit Price:</strong> ₹{product.unitPrice}</p>
          <p><strong>Location:</strong> {product.location || '-'}</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Stock Levels</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: product.currentStock <= product.minStockAlert ? 'red' : 'inherit' }}>
            {product.currentStock}
          </div>
          <p style={{ color: '#6b7280' }}>Min Alert Level: {product.minStockAlert}</p>
          {product.currentStock <= product.minStockAlert && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>⚠️ Low Stock Warning</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Stock History</h3>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>By User</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${h.type === 'IN' ? 'success' : 'error'}`}>
                      {h.type}
                    </span>
                  </td>
                  <td>{h.type === 'IN' ? '+' : '-'}{h.quantityChanged}</td>
                  <td>{h.reason}</td>
                  <td>{h.createdBy}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No stock history</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default ProductDetail;
