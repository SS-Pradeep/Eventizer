import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminLetterApproval = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchLetters();
  }, [filter]);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'pending' 
        ? '/api/admin/letters/pending' 
        : `/api/admin/letters/all?status=${filter}`;

      const response = await axios.get(endpoint);
      setLetters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching letters:', error);
      alert('Error fetching letters: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

const handleApprove = async (letterId) => {
  if (!window.confirm('Are you sure you want to approve this request?')) return;
  
  try {
    setActionLoading(letterId);
    
    const response = await axios.put(`/api/request/${letterId}/status`, {
      action: 'approve',
      admin_id: 1 // Replace with actual admin ID from auth
    });
    
    if (response.data.success) {
      alert('✅ Request approved successfully!');
      await fetchLetters();
    }
  } catch (error) {
    console.error('Error approving request:', error);
    alert('❌ Error: ' + (error.response?.data?.error || 'Unknown error'));
  } finally {
    setActionLoading(null);
  }
};

const handleReject = async () => {
  try {
    setActionLoading(selectedLetter.letter_id);
    
    const response = await axios.put(`/api/request/${selectedLetter.letter_id}/status`, {
      action: 'reject',
      admin_id: 1, // Replace with actual admin ID from auth
      reason: rejectReason.trim()
    });

    if (response.data.success) {
      alert('❌ Request rejected successfully!');
      
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedLetter(null);
      
      await fetchLetters();
    }
  } catch (error) {
    console.error('Error rejecting request:', error);
    alert('❌ Error: ' + (error.response?.data?.error || 'Unknown error'));
  } finally {
    setActionLoading(null);
  }
};

  const openViewModal = (letter) => {
    setSelectedLetter(letter);
    setShowViewModal(true);
  };

  const openRejectModal = (letter) => {
    setSelectedLetter(letter);
    setShowRejectModal(true);
  };

  const closeModals = () => {
    setShowRejectModal(false);
    setShowViewModal(false);
    setRejectReason('');
    setSelectedLetter(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading letters...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel - Letter Approval</h1>
        <p className="text-gray-600">Review and manage employee leave request letters</p>
      </div>

      {/* Stats & Filter */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{letters.length}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{letters.filter(l => l.status === 'pending').length}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{letters.filter(l => l.status === 'approved').length}</div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{letters.filter(l => l.status === 'rejected').length}</div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">⏳ Pending ({letters.filter(l => l.status === 'pending').length})</option>
              <option value="approved">✅ Approved ({letters.filter(l => l.status === 'approved').length})</option>
              <option value="rejected">❌ Rejected ({letters.filter(l => l.status === 'rejected').length})</option>
              <option value="all">📋 All Letters ({letters.length})</option>
            </select>
            
            <button
              onClick={fetchLetters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Letters List */}
      {letters.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">{getStatusIcon(filter)}</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No {filter} letters found</h3>
          <p className="text-gray-500">
            {filter === 'pending' ? 'All caught up! No pending letters to review.' : 'No letters match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {letters.map((letter) => (
            <div key={letter.letter_id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Letter Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Request #{letter.request_id}</h3>
                        <p className="text-sm text-gray-500">Letter ID: {letter.letter_id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(letter.status)}`}>
                        {getStatusIcon(letter.status)} {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Employee:</span>
                        <p className="text-gray-900">{letter.username || 'Unknown'}</p>
                        <p className="text-gray-500">{letter.email || 'No email'}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600">Leave Period:</span>
                        <p className="text-gray-900">
                          {letter.start_date ? formatDate(letter.start_date) : 'N/A'} - {letter.end_date ? formatDate(letter.end_date) : 'N/A'}
                        </p>
                        <p className="text-gray-500">Reason: {letter.reason || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600">Submitted:</span>
                        <p className="text-gray-900">{letter.created_at ? formatDate(letter.created_at) : 'Unknown'}</p>
                        {letter.approved_at && (
                          <p className="text-gray-500">
                            {letter.status === 'approved' ? 'Approved' : 'Rejected'}: {formatDate(letter.approved_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {letter.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{letter.rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                    <button
                      onClick={() => openViewModal(letter)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      👁️ View Details
                    </button>
                    
                    <a
                      href={letter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium text-center"
                    >
                      📄 View PDF
                    </a>

                    {letter.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(letter.letter_id)}
                          disabled={actionLoading === letter.letter_id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {actionLoading === letter.letter_id ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Approving...
                            </span>
                          ) : (
                            '✅ Approve'
                          )}
                        </button>
                        
                        <button
                          onClick={() => openRejectModal(letter)}
                          disabled={actionLoading === letter.letter_id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Letter Details</h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Request Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Request ID:</strong> {selectedLetter.request_id}</div>
                    <div><strong>Letter ID:</strong> {selectedLetter.letter_id}</div>
                    <div><strong>File Key:</strong> {selectedLetter.file_key}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusBadge(selectedLetter.status)}`}>
                        {getStatusIcon(selectedLetter.status)} {selectedLetter.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Employee Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedLetter.username || 'N/A'}</div>
                    <div><strong>Email:</strong> {selectedLetter.email || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Leave Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Start Date:</strong> {selectedLetter.start_date ? formatDate(selectedLetter.start_date) : 'N/A'}</div>
                  <div><strong>End Date:</strong> {selectedLetter.end_date ? formatDate(selectedLetter.end_date) : 'N/A'}</div>
                </div>
                <div className="mt-3">
                  <strong>Reason:</strong>
                  <p className="mt-1 p-3 bg-gray-50 rounded border text-sm">{selectedLetter.reason || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Submitted:</strong> {selectedLetter.created_at ? formatDate(selectedLetter.created_at) : 'N/A'}</div>
                  {selectedLetter.approved_at && (
                    <div><strong>{selectedLetter.status === 'approved' ? 'Approved' : 'Rejected'}:</strong> {formatDate(selectedLetter.approved_at)}</div>
                  )}
                  {selectedLetter.approved_by_username && (
                    <div><strong>Processed by:</strong> {selectedLetter.approved_by_username}</div>
                  )}
                </div>
                
                {selectedLetter.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <strong className="text-red-800">Rejection Reason:</strong>
                    <p className="text-red-700 text-sm mt-1">{selectedLetter.rejection_reason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <a
                  href={selectedLetter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  📄 View PDF in New Tab
                </a>
                
                {selectedLetter.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        closeModals();
                        handleApprove(selectedLetter.letter_id);
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      ✅ Approve
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        openRejectModal(selectedLetter);
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reject Leave Request
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Request #{selectedLetter.request_id} - {selectedLetter.username || 'Unknown User'}
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Please provide a detailed reason for rejection..."
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 This reason will be visible to the employee.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rejecting...
                  </span>
                ) : (
                  '❌ Reject Request'
                )}
              </button>
              
              <button
                onClick={closeModals}
                disabled={actionLoading}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLetterApproval;
