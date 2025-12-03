import { useEffect, useState, useCallback, useMemo } from "react";
import './css/letterapproval.css';

export default function SuperAdminLetterApproval() {
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [updating, setUpdating] = useState(false);

  // Memoized grouped requests for performance
  const groupedRequests = useMemo(() => {
    return requests.reduce((groups, request) => {
      const eventName = request.event_name;
      if (!groups[eventName]) {
        groups[eventName] = [];
      }
      groups[eventName].push(request);
      return groups;
    }, {});
  }, [requests]);

  // Optimized fetch function
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/superrequest?status=${filter}`);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      console.log('Fetched data:', data);
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        setRequests([]);
      }
      setSelectedRequests(new Set());
    } catch (e) {
      console.error("Error fetching requests:", e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Optimized selection handlers
  const handleRequestSelect = useCallback((requestId, isSelected) => {
    setSelectedRequests(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(requestId);
      } else {
        newSelected.delete(requestId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAllInGroup = useCallback((eventName, isSelected) => {
    setSelectedRequests(prev => {
      const newSelected = new Set(prev);
      const groupRequests = groupedRequests[eventName];
      
      groupRequests.forEach(req => {
        if (isSelected) {
          newSelected.add(req.request_id);
        } else {
          newSelected.delete(req.request_id);
        }
      });
      
      return newSelected;
    });
  }, [groupedRequests]);

  // Fixed update function with correct endpoint
  const handleUpdate = useCallback(async (requestIds, newStatus) => {
    setUpdating(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/superrequests/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestIds: requestIds,
          status: newStatus 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      const result = await response.json();
      console.log('Update result:', result);

      // Remove updated requests from current view if they're no longer in this filter
      if (result.success && result.updated.length > 0) {
        setRequests(prev => 
          prev.filter(req => !result.updated.includes(req.request_id))
        );

        // Clear selections for updated requests
        setSelectedRequests(prev => {
          const newSelected = new Set(prev);
          result.updated.forEach(id => newSelected.delete(id));
          return newSelected;
        });

        // Success message
        const count = Array.isArray(requestIds) ? requestIds.length : 1;
        alert(`${count} request(s) ${newStatus} successfully by HOD!`);
      }

      if (result.failed && result.failed.length > 0) {
        alert(`${result.updated.length} updated, ${result.failed.length} failed`);
      }

    } catch (error) {
      console.error('Update error:', error);
      alert(`Update failed: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  }, []);

  // Memoized group selection helpers
  const isGroupFullySelected = useCallback((eventName) => {
    const groupRequests = groupedRequests[eventName];
    return groupRequests?.every(req => selectedRequests.has(req.request_id)) || false;
  }, [groupedRequests, selectedRequests]);

  const isGroupPartiallySelected = useCallback((eventName) => {
    const groupRequests = groupedRequests[eventName];
    if (!groupRequests) return false;
    const selectedInGroup = groupRequests.filter(req => selectedRequests.has(req.request_id));
    return selectedInGroup.length > 0 && selectedInGroup.length < groupRequests.length;
  }, [groupedRequests, selectedRequests]);

  const toggleGroup = useCallback((eventName) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(eventName)) {
        newExpanded.delete(eventName);
      } else {
        newExpanded.add(eventName);
      }
      return newExpanded;
    });
  }, []);

  return (
    <div className="mainapproval">
      <div className="panelapprovaltop">
        <h2>Permission Letter Approval (HOD)</h2>
        <select
          className="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Bulk actions */}
      {filter === "pending" && selectedRequests.size > 0 && (
        <div className="bulk-actions">
          <span>Selected: {selectedRequests.size} requests</span>
          <button 
            className="btn btn-accept"
            onClick={() => handleUpdate(Array.from(selectedRequests), "approved")}
            disabled={updating}
          >
            {updating ? 'Updating...' : `Accept Selected (${selectedRequests.size})`}
          </button>
          <button 
            className="btn btn-reject"
            onClick={() => handleUpdate(Array.from(selectedRequests), "rejected")}
            disabled={updating}
          >
            {updating ? 'Updating...' : `Reject Selected (${selectedRequests.size})`}
          </button>
        </div>
      )}

      <div className="letterslist">
        {loading ? (
          <div className="empty">Loading requests…</div>
        ) : Object.keys(groupedRequests).length === 0 ? (
          <div className="empty">No {filter} requests found.</div>
        ) : (
          Object.entries(groupedRequests).map(([eventName, eventRequests]) => (
            <div key={eventName} className="event-group">
              <div className="group-header">
                <div className="group-title-section">
                  <button
                    className="expand-button"
                    onClick={() => toggleGroup(eventName)}
                    disabled={updating}
                  >
                    {expandedGroups.has(eventName) ? '▼' : '▶'}
                  </button>
                  
                  {filter === "pending" && (
                    <input
                      type="checkbox"
                      checked={isGroupFullySelected(eventName)}
                      ref={input => {
                        if (input) input.indeterminate = isGroupPartiallySelected(eventName);
                      }}
                      onChange={(e) => handleSelectAllInGroup(eventName, e.target.checked)}
                      className="group-checkbox"
                      disabled={updating}
                    />
                  )}
                  
                  <h3 className="group-title">
                    {eventName} ({eventRequests.length} requests)
                  </h3>
                </div>
              </div>

              {expandedGroups.has(eventName) && (
                <div className="group-content">
                  {eventRequests.map((req) => (
                    <div key={req.request_id} className="letter-card-wrapper">
                      <div className="letter-card">
                        <div className="letter-card__header">
                          {filter === "pending" && (
                            <input
                              type="checkbox"
                              checked={selectedRequests.has(req.request_id)}
                              onChange={(e) => handleRequestSelect(req.request_id, e.target.checked)}
                              className="request-checkbox"
                              disabled={updating}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          
                          <div 
                            className="card-info"
                            onClick={() => setExpandedId(expandedId === req.request_id ? null : req.request_id)}
                            role="button"
                            tabIndex={0}
                          >
                            <h4 className="letter-title">{req.name}</h4>
                            <span className={`status status--${req.permission_letter_status}`}>
                              {req.permission_letter_status}
                              {req.permission_letter_status === 'approved' && req.approved_by && 
                                ` by ${req.approved_by}`}
                              {req.permission_letter_status === 'rejected' && req.rejected_by && 
                                ` by ${req.rejected_by}`}
                            </span>
                          </div>
                        </div>
                        
                        <p className="letter-desc">
                          Roll Number: {req.roll_number}<br/>
                          Event Type: {req.event_type}<br/>
                          Organizer: {req.organizer}
                        </p>

                        {filter === "pending" && !selectedRequests.has(req.request_id) && (
                          <div className="actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-accept"
                              onClick={() => handleUpdate(req.request_id, "approved")}
                              disabled={updating}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-reject"
                              onClick={() => handleUpdate(req.request_id, "rejected")}
                              disabled={updating}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
