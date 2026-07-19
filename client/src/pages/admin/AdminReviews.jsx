import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminHeader from '../../components/AdminHeader';
import AdminModal from '../../components/AdminModal';
import Toast from '../../components/Toast';
import { 
  getAdminReviews, 
  deleteAdminReview,
  approveAdminReview,
  flagAdminReview
} from '../../services/api';
import './AdminReviews.css';
import PageLoader from '../../components/PageLoader';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All Reviews');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, review: null });
  const [approveModal, setApproveModal] = useState({ isOpen: false, review: null });
  const [flagModal, setFlagModal] = useState({ isOpen: false, review: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination (Using "Load More" style per UIUX)
  const [displayCount, setDisplayCount] = useState(6);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await getAdminReviews();
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const handleDeleteClick = (review) => {
    setDeleteModal({ isOpen: true, review });
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await deleteAdminReview(deleteModal.review._id);
      setReviews(reviews.filter(r => r._id !== deleteModal.review._id));
      setDeleteModal({ isOpen: false, review: null });
      showToast('Review deleted successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveClick = (review) => {
    setApproveModal({ isOpen: true, review });
  };

  const handleApproveConfirm = async () => {
    setIsSubmitting(true);
    try {
      await approveAdminReview(approveModal.review._id);
      const updatedReviews = reviews.map(r => 
        r._id === approveModal.review._id 
          ? { ...r, isApproved: true }
          : r
      );
      setReviews(updatedReviews);
      setApproveModal({ isOpen: false, review: null });
      showToast('Review approved successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to approve review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagClick = (review) => {
    setFlagModal({ isOpen: true, review });
  };

  const handleFlagConfirm = async () => {
    setIsSubmitting(true);
    try {
      await flagAdminReview(flagModal.review._id);
      const updatedReviews = reviews.map(r => 
        r._id === flagModal.review._id 
          ? { ...r, flagged: true }
          : r
      );
      setReviews(updatedReviews);
      setFlagModal({ isOpen: false, review: null });
      showToast('Review flagged for review', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to flag review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filterType === 'All Reviews') return true;
    if (filterType === 'Pending') return !review.isApproved && !review.flagged;
    if (filterType === 'Approved') return review.isApproved;
    if (filterType === 'Flagged') return review.flagged;
    return true;
  });

  const displayedReviews = filteredReviews.slice(0, displayCount);

  // Stats calculation
  const totalPending = reviews.filter(r => !r.isApproved && !r.flagged).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';
  const flaggedCount = reviews.filter(r => r.flagged).length;

  return (
    <div className="admin-page-wrapper">
      {mobileMenuOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <AdminSidebar activePage="reviews" isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="admin-content">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="admin-main admin-reviews-main">
          {/* Page Header & Filters */}
          <div className="reviews-page-header">
            <div>
              <h2>Review Moderation</h2>
              <p>Manage and moderate patient feedback across your healthcare network.</p>
            </div>
            <div className="filter-pill-container">
              <button 
                className={`filter-pill-btn ${filterType === 'Pending' ? 'active' : ''}`}
                onClick={() => setFilterType('Pending')}
              >
                Pending ({totalPending})
              </button>
              <button 
                className={`filter-pill-btn ${filterType === 'Approved' ? 'active' : ''}`}
                onClick={() => setFilterType('Approved')}
              >
                Approved ({approvedCount})
              </button>
              <button 
                className={`filter-pill-btn ${filterType === 'Flagged' ? 'active' : ''}`}
                onClick={() => setFilterType('Flagged')}
              >
                Flagged ({flaggedCount})
              </button>
              <button 
                className={`filter-pill-btn ${filterType === 'All Reviews' ? 'active' : ''}`}
                onClick={() => setFilterType('All Reviews')}
              >
                All Reviews
              </button>
            </div>
          </div>

          {/* Dashboard Stats Row */}
          <div className="reviews-stats-grid">
            <div className="reviews-stat-card">
              <p className="stat-label">Pending Reviews</p>
              <h3 className="color-warning-text">{totalPending}</h3>
            </div>
            <div className="reviews-stat-card">
              <p className="stat-label">Approved Reviews</p>
              <h3 className="color-secondary-text">{approvedCount}</h3>
            </div>
            <div className="reviews-stat-card">
              <p className="stat-label">Avg. Rating</p>
              <div className="flex-value">
                <h3>{avgRating}</h3>
                <span className="material-symbols-outlined color-warning-text">star</span>
              </div>
            </div>
            <div className="reviews-stat-card">
              <p className="stat-label">Flagged</p>
              <h3 className="color-danger-text">{flaggedCount}</h3>
            </div>
          </div>

          {loading ? (
            <PageLoader message="Loading reviews..." />
          ) : displayedReviews.length > 0 ? (
            <div className="reviews-grid">
              {displayedReviews.map((review) => (
                <div className="review-card" key={review._id}>
                  <div className="review-card-header">
                    <div className="patient-info">
                      <div className="patient-avatar">
                        {review.patientId?.name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <p className="patient-name">{review.patientId?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    {review.flagged ? (
                      <div className="status-badge-mini bg-pale-red text-red-700">FLAGGED</div>
                    ) : !review.isApproved ? (
                      <div className="status-badge-mini bg-pale-amber text-amber-700">PENDING</div>
                    ) : (
                      <div className="status-badge-mini bg-pale-teal text-teal-700">APPROVED</div>
                    )}
                  </div>
                  
                  <div className="review-doctor-info">
                    <div className="doc-name">
                      <span className="material-symbols-outlined color-primary-text">medical_information</span>
                      <p>Dr. {review.doctorId?.userId?.name || 'Unknown'}</p>
                    </div>
                    <div className="review-stars color-warning-text">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: star <= review.rating ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="review-comment">"{review.comment || 'No written comment provided.'}"</p>

                  <div className="review-card-footer">
                    <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                    <div className="review-actions">
                      {review.flagged ? (
                        <button 
                          className="btn-danger-outline"
                          onClick={() => handleDeleteClick(review)}
                        >
                          <span className="material-symbols-outlined">delete</span>
                          Delete
                        </button>
                      ) : (
                        <button 
                          className="btn-danger-outline"
                          onClick={() => handleFlagClick(review)}
                        >
                          <span className="material-symbols-outlined">flag</span>
                          Flag
                        </button>
                      )}
                      {!review.isApproved && (
                        <button 
                          className="btn-success-filled"
                          onClick={() => handleApproveClick(review)}
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state admin-empty-state">
              <span className="material-symbols-outlined text-4xl text-slate-300">rate_review</span>
              <p className="mt-4 color-slate-medium">No reviews found.</p>
            </div>
          )}

          {filteredReviews.length > displayCount && (
            <div className="load-more-container align-text-center mt-8">
              <button 
                className="btn-outline-pill"
                onClick={() => setDisplayCount(prev => prev + 6)}
              >
                Load More Reviews
              </button>
              <p className="color-slate-medium mt-2 text-sm">Showing {displayCount} of {filteredReviews.length} {filterType.toLowerCase()} reviews</p>
            </div>
          )}
        </main>
      </div>

      {/* Delete Modal */}
      <AdminModal
        isOpen={deleteModal.isOpen}
        title="Delete Review"
        onClose={() => setDeleteModal({ isOpen: false, review: null })}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete Review"
        isDangerous={true}
        isLoading={isSubmitting}
      >
        <p>Are you sure you want to delete this review? This action cannot be undone.</p>
      </AdminModal>

      {/* Approve Modal */}
      <AdminModal
        isOpen={approveModal.isOpen}
        title="Approve Review"
        onClose={() => setApproveModal({ isOpen: false, review: null })}
        onConfirm={handleApproveConfirm}
        confirmText="Approve Review"
        isLoading={isSubmitting}
      >
        <p>
          Are you sure you want to approve this review for <strong>Dr. {approveModal.review?.doctorId?.userId?.name}</strong>?
        </p>
        <p className="admin-modal-subtext">
          The review will be published and visible to other users.
        </p>
      </AdminModal>

      {/* Flag Modal */}
      <AdminModal
        isOpen={flagModal.isOpen}
        title="Flag Review"
        onClose={() => setFlagModal({ isOpen: false, review: null })}
        onConfirm={handleFlagConfirm}
        confirmText="Flag Review"
        isDangerous={true}
        isLoading={isSubmitting}
      >
        <p>
          Are you sure you want to flag this review for further investigation?
        </p>
        <p className="admin-modal-subtext">
          Flagged reviews will be reviewed by the moderation team and may be deleted if they violate our guidelines.
        </p>
      </AdminModal>

      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
    </div>
  );
}
