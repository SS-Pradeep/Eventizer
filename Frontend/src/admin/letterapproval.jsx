import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import auth from "./config/firebase-config";
import './css/letterapproval.css';

export default function AdminLetterApproval() {
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [user, setUser] = useState(null);
  const [uid, setUid] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Get Firebase UID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUid(currentUser.uid);
        console.log('Current user UID:', currentUser.uid);
      } else {
        setUser(null);
        setUid(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Updated fetch URL to match backend endpoint
  useEffect(() => {
    if (!uid) return; // Don't fetch without UID

    const fetchRequests = async () => {
      try {
        setLoading(true);
        
        // Include UID in the request if your backend needs it
        const res = await fetch(
          `http://localhost:3000/api/requests?status=${filter}&uid=${uid}`,
          {
            headers: { Accept: "application/json" },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch requests: ${res.statusText}`);
        }

        const data = await res.json();
        if (data.success) {
          setRequests(data.data || []);
        } else {
          throw new Error(data.error || "Failed to fetch requests");
        }
      } catch (e) {
        console.error("Error:", e);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [filter, uid]); // Added uid as dependency

  const handleStatusChange = async (requestId, newStatus) => {
    if (!uid) {
      console.error('No user authenticated');
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/api/requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            uid: uid, 
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      if (data.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.request_id === requestId ? { ...r, status: newStatus } : r
          )
        );
      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (e) {
      console.error("Error:", e);
      // Consider adding a UI notification for errors
    }
  };

  const onPdfLoad = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="mainapproval">
        <div className="empty">Checking authentication...</div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!uid) {
    return (
      <div className="mainapproval">
        <div className="empty">Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className="mainapproval">
      <div className="panelapprovaltop">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Permission Letter Approval</h2>
          
        </div>
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

      <div className="letterslist">
        {loading ? (
          <div className="empty">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="empty">No {filter} requests found.</div>
        ) : (
          requests.map((req) => (
            <div key={req.request_id} className="letter-card-wrapper">
              <div
                className="letter-card"
                onClick={() =>
                  setExpandedId(
                    expandedId === req.request_id ? null : req.request_id
                  )
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  setExpandedId(
                    expandedId === req.request_id ? null : req.request_id
                  )
                }
              >
                <div className="letter-card__header">
                  <h3 className="letter-title">{req.student_name}</h3>
                  <span
                    className={`status status--${req.permission_letter_status || req.status}`}
                  >
                    {req.permission_letter_status || req.status}
                  </span>
                </div>
                <p className="letter-desc">
                  Name: {req.name || req.student_name}<br />
                  Roll Number: {req.roll_number}<br />
                  Event Name: {req.event_name}<br />
                  Event Type: {req.event_type}
                </p>

                {filter === "pending" && (
                  <div
                    className="actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-accept"
                      onClick={() =>
                        handleStatusChange(req.request_id, "approved")
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() =>
                        handleStatusChange(req.request_id, "rejected")
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded view */}
              {expandedId === req.request_id && (
                <div className="preview-inline">
                  <div className="preview-header">
                    <h3 className="preview-title">{req.student_name}</h3>
                    <p className="preview-meta">
                      Event: <b>{req.event_name}</b> ({req.event_type})
                    </p>
                    <p className="preview-meta">
                      Roll Number: <b>{req.roll_number}</b>
                    </p>
                    <p className="preview-meta">
                      Organizer: <b>{req.organizer}</b>
                    </p>
                    <p className="preview-meta">
                      Event Level: <b>{req.event_level}</b>
                    </p>
                    <p className="preview-meta">
                      Event Dates: <b>{req.start_date} to {req.end_date}</b>
                    </p>
                    <p>
                      Status:{" "}
                      <span
                        className={`status status--${req.permission_letter_status || req.status}`}
                      >
                        {req.permission_letter_status || req.status}
                      </span>
                    </p>

                    {(req.permission_letter_status === "pending" || req.status === "pending") && (
                      <div className="preview-actions">
                        <button
                          className="btn btn-accept"
                          onClick={() =>
                            handleStatusChange(req.request_id, "approved")
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() =>
                            handleStatusChange(req.request_id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="preview-body">
                    {req.letter_url ? (
                      <div className="pdf-container">
                        <div className="empty">
                          📄 Permission letter available<br />
                          <a 
                            href={req.letter_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'underline' }}
                          >
                            Click to view document
                          </a>
                        </div>
                        {/* 
                        <Document
                          file={req.letter_url}
                          onLoadSuccess={onPdfLoad}
                          loading={<div className="empty">Loading PDF…</div>}
                          error={<div className="empty">Unable to load PDF.</div>}
                        >
                          <Page pageNumber={pageNumber} />
                        </Document>

                        {numPages > 1 && (
                          <div className="pager">
                            <button
                              className="btn"
                              onClick={() =>
                                setPageNumber((p) => Math.max(1, p - 1))
                              }
                              disabled={pageNumber <= 1}
                            >
                              Prev
                            </button>
                            <span className="pager-info">
                              {pageNumber} / {numPages}
                            </span>
                            <button
                              className="btn"
                              onClick={() =>
                                setPageNumber((p) =>
                                  Math.min(numPages || 1, p + 1)
                                )
                              }
                              disabled={
                                numPages ? pageNumber >= numPages : true
                              }
                            >
                              Next
                            </button>
                          </div>
                        )} 
                        */}
                      </div>
                    ) : (
                      <div className="empty">
                        No permission letter available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
