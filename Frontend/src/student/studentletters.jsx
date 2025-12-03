import { useEffect, useState } from "react";
import auth from "../config/firebase-config";
import './css/studentletters.css';

const Studentletters = () => {
  const uid = auth.currentUser?.uid;    
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3000/requeststudent/${uid}?status=${filter}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const response = await res.json();
        console.log("Fetched student requests:", response);
        if (response.success && response.data) {
          setRequests(response.data);  
        } else {
          setRequests([]);
        }
      } catch (e) {
        console.error("Error fetching requests:", e);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    if (uid) fetchRequests();
  }, [uid, filter]);

  return (
    <div className="mainapproval">
      <div className="panelapprovaltop">
        <h2>My Permission Letters</h2>
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
            <div key={req.event_id} className="letter-card-wrapper">
              <div
                className="letter-card"
                onClick={() =>
                  setExpandedId(expandedId === req.event_id ? null : req.event_id)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  setExpandedId(expandedId === req.event_id ? null : req.event_id)
                }
              >
                <div className="letter-card__header">
                  <h3 className="letter-title">{req.event_name}</h3>
                  <div className="status-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span
                      className={`status status--${req.permission_letter_status}`}
                    >
                      {req.permission_letter_status}
                    </span>
                    
                    {/* Show current stage for pending requests */}
                    {req.permission_letter_status === 'pending' && req.current_stage && (
                      <span
                        className="current-stage"
                        style={{
                          fontSize: '12px',
                          color: '#6c757d',
                          marginTop: '4px',
                          fontWeight: '500',
                          backgroundColor: '#f8f9fa',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #dee2e6'
                        }}
                      >
                        📍 {req.current_stage}
                      </span>
                    )}
                    
                    {/* Show rejected_by for rejected requests */}
                    {req.permission_letter_status === 'rejected' && req.rejected_by && (
                      <span
                        className="rejected-by"
                        style={{
                          fontSize: '12px',
                          color: '#dc3545',
                          marginTop: '4px',
                          fontWeight: '500',
                          backgroundColor: '#f8d7da',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #f5c6cb'
                        }}
                      >
                        ❌ Rejected by {req.rejected_by}
                      </span>
                    )}
                  </div>
                </div>
                <p className="letter-desc">
                  Organiser: {req.organizer} <br />
                  End Date: {new Date(req.end_date).toLocaleDateString()}
                </p>
              </div>

              {expandedId === req.event_id && (
                <div className="preview-inline">
                  {/* Header Info */}
                  <div className="preview-header">
                    <h3 className="preview-title">{req.event_name}</h3>
                    <p>
                      Organiser: <b>{req.organizer}</b>
                    </p>
                    <p>
                      End Date: {new Date(req.end_date).toLocaleDateString()}
                    </p>
                    <p>
                      Status:{" "}
                      <span
                        className={`status status--${req.permission_letter_status}`}
                      >
                        {req.permission_letter_status}
                      </span>
                      
                      {/* Show current stage in expanded view for pending requests */}
                      {req.permission_letter_status === 'pending' && req.current_stage && (
                        <span
                          style={{
                            marginLeft: '10px',
                            fontSize: '14px',
                            color: '#6c757d',
                            fontWeight: '500',
                            backgroundColor: '#f8f9fa',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                          }}
                        >
                          Currently at: {req.current_stage}
                        </span>
                      )}
                      
                      {/* Show rejected_by in expanded view for rejected requests */}
                      {req.permission_letter_status === 'rejected' && req.rejected_by && (
                        <span
                          style={{
                            marginLeft: '10px',
                            fontSize: '14px',
                            color: '#dc3545',
                            fontWeight: '500',
                            backgroundColor: '#f8d7da',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #f5c6cb'
                          }}
                        >
                          Rejected by: {req.rejected_by}
                        </span>
                      )}
                      
                      {/* Show approved_by for approved requests */}
                      {req.permission_letter_status === 'approved' && req.approved_by && (
                        <span
                          style={{
                            marginLeft: '10px',
                            fontSize: '14px',
                            color: '#28a745',
                            fontWeight: '500',
                            backgroundColor: '#d4edda',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #c3e6cb'
                          }}
                        >
                          Approved by: {req.approved_by}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* PDF LETTER PREVIEW */}
                  <div className="preview-body">
                    {req.file_url ? (
                      <div className="pdf-container">
                        <div className="pdf-header" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '15px',
                          padding: '10px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px'
                        }}>
                          <h4 style={{ margin: 0, color: '#333' }}>
                            📄 Permission Letter
                          </h4>
                          <div className="pdf-actions">
                            <button
                              onClick={() => window.open(req.file_url, '_blank')}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '8px',
                                fontSize: '14px'
                              }}
                            >
                              🔗 Open Full View
                            </button>
                            <a
                              href={req.file_url}
                              download={`permission-letter-${req.event_name.replace(/\s+/g, '-')}.pdf`}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            >
                              📥 Download PDF
                            </a>
                          </div>
                        </div>

                        {/* EMBEDDED PDF VIEWER */}
                        <div className="pdf-viewer">
                          <iframe
                            src={req.file_url}
                            title={`Permission Letter - ${req.event_name}`}
                            width="100%"
                            height="600px"
                            style={{ 
                              border: '2px solid #ddd', 
                              borderRadius: '8px',
                              backgroundColor: '#ffffff'
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="empty" style={{
                        padding: '40px',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        color: '#666'
                      }}>
                        {req.permission_letter_status === 'pending' 
                          ? `📝 Permission letter will be generated after approval. Currently at: ${req.current_stage || 'Initial Stage'}`
                          : req.permission_letter_status === 'approved'
                          ? "⏳ PDF is being generated. Please refresh in a moment."
                          : req.permission_letter_status === 'rejected'
                          ? `❌ Request was rejected by ${req.rejected_by || 'Administrator'}. No permission letter will be generated.`
                          : "❌ Permission letter not available for this request."
                        }
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
};

export default Studentletters;
