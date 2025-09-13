import { useEffect, useState, useCallback, useMemo } from "react";
import './letterapp.css';

export default function AdminLetterApproval() {
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
      const res = await fetch(`http://localhost:3000/superrequest?status=${filter}`);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      setRequests(data);
      setSelectedRequests(new Set());
    } catch (e) {
      console.error("Error fetching requests:", e);
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

  // Unified optimal update function - handles both single and bulk
  const handleUpdate = useCallback(async (requestIds, newStatus) => {
    setUpdating(true);
    
    try {
      const response = await fetch('http://localhost:3000/superrequests/update', {
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

      // Optimized state update - only update changed records
      if (result.updated.length > 0) {
        setRequests(prev => 
          prev.map(req => {
            if (result.updated.includes(req.request_id)) {
              return {
                ...req,
                permission_letter_status: newStatus,
                curr_stage: newStatus === 'pending' ? 'superadmin' : 'completed'
              };
            }
            return req;
          })
        );

        // Clear selections for updated requests
        setSelectedRequests(prev => {
          const newSelected = new Set(prev);
          result.updated.forEach(id => newSelected.delete(id));
          return newSelected;
        });
      }

      // User feedback
      if (result.failed.length > 0) {
        alert(`${result.updated.length} updated, ${result.failed.length} failed`);
      } else {
        const count = Array.isArray(requestIds) ? requestIds.length : 1;
        alert(`${count} request(s) ${newStatus} successfully!`);
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
        <h2>Permission Letter Approval</h2>
        <select
          className="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Bulk actions */}
      {filter === "pending" && selectedRequests.size > 0 && (
        <div className="bulk-actions">
          <span>Selected: {selectedRequests.size} requests</span>
          <button 
            className="btn btn-accept"
            onClick={() => handleUpdate(Array.from(selectedRequests), "accepted")}
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
                            </span>
                          </div>
                        </div>
                        
                        <p className="letter-desc">
                          Roll Number: {req.roll_number}<br/>
                          Event Type: {req.event_type}
                        </p>

                        {filter === "pending" && !selectedRequests.has(req.request_id) && (
                          <div className="actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-accept"
                              onClick={() => handleUpdate(req.request_id, "accepted")}
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

                      {expandedId === req.request_id && (
                        <div className="preview-inline">
                          <div className="preview-header">
                            <h3 className="preview-title">{req.name}</h3>
                            <p className="preview-meta">
                              Event: <b>{req.event_name}</b> ({req.event_type})
                            </p>
                            <p>
                              Status: <span className={`status status--${req.permission_letter_status}`}>
                                {req.permission_letter_status}
                              </span>
                            </p>

                            {req.permission_letter_status === "pending" && (
                              <div className="preview-actions">
                                <button
                                  className="btn btn-accept"
                                  onClick={() => handleUpdate(req.request_id, "accepted")}
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

                          <div className="preview-body">
                            {req.letter_url ? (
                              <div className="pdf-container">
                                {/* PDF viewer code */}
                              </div>
                            ) : (
                              <div className="empty">No permission letter available.</div>
                            )}
                          </div>
                        </div>
                      )}
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
