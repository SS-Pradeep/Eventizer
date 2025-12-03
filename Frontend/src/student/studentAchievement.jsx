import { useState, useEffect } from "react";
import auth from "../config/firebase-config";
import './css/studentAchievement.css';

const Achievements = () => {
  const uid = auth.currentUser?.uid;
  const [filter, setFilter] = useState(false); 
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  
  const [pdfUrls, setPdfUrls] = useState({});
  const [loadingUrls, setLoadingUrls] = useState({});

  const hasEventEnded = (endDate) => {
    const currentDate = new Date();
    const eventEndDate = new Date(endDate);
    
    currentDate.setHours(0, 0, 0, 0);
    eventEndDate.setHours(0, 0, 0, 0);
    
    return currentDate >= eventEndDate;
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3000/certificateshow/${uid}/${filter}`);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const response = await res.json();
        console.log("Fetched student requests:", response);
        
        if (response.success && response.data) {
          setRequests(response.data);
        } else if (Array.isArray(response)) {
          setRequests(response);
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

  // Enhanced PDF function to handle both permission letters and certificates
  const getPdfUrl = async (requestId, documentType) => {
    const key = `${requestId}-${documentType}`;
    
    if (pdfUrls[key]) {
      return pdfUrls[key];
    }

    try {
      setLoadingUrls(prev => ({ ...prev, [key]: true }));
      
      let endpoint;
      if (documentType === 'permission') {
        // For permission letters
        endpoint = `http://localhost:3000/api/pdf/${requestId}`;
      } else if (documentType === 'certificate') {
        // For certificates
        endpoint = `http://localhost:3000/api/certificate/${requestId}`;
      }
      
      console.log(`🔗 Loading ${documentType} from:`, endpoint);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned HTML instead of JSON. Check if the endpoint exists.');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPdfUrls(prev => ({
          ...prev,
          [key]: data.url
        }));
        return data.url;
      } else {
        throw new Error(data.error || 'Failed to get PDF URL');
      }
    } catch (error) {
      console.error(`Error getting ${documentType} URL:`, error);
      return null;
    } finally {
      setLoadingUrls(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmit = async (e, eventId) => {
    e.preventDefault();
    
    console.log('🚀 Starting upload for eventId:', eventId);

    const fileInput = e.target.elements.file;
    if (!fileInput.files.length) {
      return;
    }

    const file = fileInput.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const formData = new FormData();
    formData.append("certificate", file);

    try {
      const res = await fetch(`http://localhost:3000/upload-certificate/${eventId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Upload failed");
      }

      console.log("Upload success:", data);
      
      // Refresh the current view
      const fetchRequests = async () => {
        const res = await fetch(`http://localhost:3000/certificateshow/${uid}/${filter}`);
        const response = await res.json();
        
        if (response.success && response.data) {
          setRequests(response.data);
        } else if (Array.isArray(response)) {
          setRequests(response);
        }
      };
      
      await fetchRequests();
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleCardClick = async (requestId, mode) => {
    if (expandedId === requestId && viewMode === mode) {
      setExpandedId(null);
      setViewMode(null);
    } else {
      setExpandedId(requestId);
      setViewMode(mode);
      
      // Auto-load PDF for both permission letters and certificates
      if (mode === 'permission' || mode === 'certificate') {
        await getPdfUrl(requestId, mode);
      }
    }
  };

  // Enhanced PDF Viewer Component
  const PDFViewer = ({ requestId, title, type }) => {
    const key = `${requestId}-${type}`;
    const isLoading = loadingUrls[key];
    const pdfUrl = pdfUrls[key];

    const loadPdf = async () => {
      await getPdfUrl(requestId, type);
    };

    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>🔄 Loading {type === 'permission' ? 'Permission Letter' : 'Certificate'}...</p>
        </div>
      );
    }

    if (!pdfUrl) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <button
            onClick={loadPdf}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📄 Load {type === 'permission' ? 'Permission Letter' : 'Certificate'}
          </button>
        </div>
      );
    }

    return (
      <div className="pdf-container">
        {/* PDF Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <h4 style={{ margin: 0, color: '#333' }}>
            {type === 'permission' ? '📋 Permission Letter' : '🏆 Certificate'}
          </h4>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.open(pdfUrl, '_blank')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔗 Open in New Tab
            </button>
            
            <a
              href={pdfUrl}
              download={`${type}-${title.replace(/\s+/g, '-')}.pdf`}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                display: 'inline-block'
              }}
            >
              📥 Download PDF
            </a>
          </div>
        </div>

        {/* PDF Viewer */}
        <iframe
          src={pdfUrl}
          title={`${title} - ${type}`}
          width="100%"
          height="600px"
          style={{ 
            border: '2px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }}
        />
      </div>
    );
  };

  return (
    <div className="mainapproval">
      <div className="panelapprovaltop">
        <h2>Certificates</h2>
        <select
          className="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value === "true")}
        >
          <option value="false">Certificate not uploaded</option>
          <option value="true">Certificate uploaded</option>
        </select>
      </div>

      <div className="letterslist">
        {loading ? (
          <div className="empty">Loading requests…</div>
        ) : !Array.isArray(requests) || requests.length === 0 ? (
          <div className="empty">No requests found.</div>
        ) : (
          requests.map((req) => (
            <div key={req.request_id || req.event_id} className="letter-card-wrapper">
              <div className="letter-card">
                <div className="letter-card__header">
                  <h3 className="letter-title">{req.event_name}</h3>
                  <span className={`status status--${req.request_status || 'available'}`}>
                    {req.request_status || 'Available'}
                  </span>
                </div>
                <p className="letter-desc">
                  Event Type: {req.event_type} <br />
                  End Date: {new Date(req.end_date).toLocaleDateString()}
                  {req.organizer && <><br />Organizer: {req.organizer}</>}
                </p>

                {/* Action Buttons */}
                <div className="action-buttons" style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px',
                  flexWrap: 'wrap'
                }}>
                  {/* Permission Letter Button - Only show if request exists */}
                  {req.request_id && (
                    <button
                      onClick={() => handleCardClick(req.request_id, 'permission')}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: expandedId === req.request_id && viewMode === 'permission' ? '#0056b3' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      📋 {expandedId === req.request_id && viewMode === 'permission' ? 'Hide' : 'View'} Permission Letter
                    </button>
                  )}

                  {/* Certificate Button Logic */}
                  {!filter ? (
                    // Show upload option for events that haven't uploaded certificates yet
                    hasEventEnded(req.end_date) ? (
                      <button
                        onClick={() => handleCardClick(req.request_id || req.event_id, 'certificate')}
                        style={{
                          padding: '10px 15px',
                          backgroundColor: expandedId === (req.request_id || req.event_id) && viewMode === 'certificate' ? '#218838' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        📤 {expandedId === (req.request_id || req.event_id) && viewMode === 'certificate' ? 'Hide' : 'Upload'} Certificate
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          padding: '10px 15px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500',
                          opacity: 0.6
                        }}
                        title="Certificate upload will be available after the event ends"
                      >
                        🔒 Upload Available After Event
                      </button>
                    )
                  ) : (
                    // Show view option for uploaded certificates
                    <button
                      onClick={() => handleCardClick(req.request_id || req.event_id, 'certificate')}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: expandedId === (req.request_id || req.event_id) && viewMode === 'certificate' ? '#218838' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🏆 {expandedId === (req.request_id || req.event_id) && viewMode === 'certificate' ? 'Hide' : 'View'} Certificate
                    </button>
                  )}
                </div>
              </div>

              {expandedId === (req.request_id || req.event_id) && (
                <div className="preview-inline">
                  <div className="preview-header">
                    <h3 className="preview-title">{req.event_name}</h3>
                    <p>Event Type: <b>{req.event_type}</b></p>
                    <p>End Date: {new Date(req.end_date).toLocaleDateString()}</p>
                    {req.organizer && <p>Organizer: <b>{req.organizer}</b></p>}
                  </div>

                  <div className="preview-body">
                    {/* Permission Letter Viewer */}
                    {viewMode === 'permission' && req.request_id && (
                      <PDFViewer 
                        requestId={req.request_id}
                        title={req.event_name}
                        type="permission"
                      />
                    )}

                    {/* Certificate Section */}
                    {viewMode === 'certificate' && (
                      <>
                        {!filter ? (
                          // Upload mode - for events that haven't uploaded certificates
                          hasEventEnded(req.end_date) ? (
                            <div className="upload-section">
                              <h4>📤 Upload Certificate</h4>
                              <form onSubmit={(e) => handleSubmit(e, req.request_id || req.event_id)}>
                                <div style={{ marginBottom: '15px' }}>
                                  <input
                                    type="file"
                                    name="file"
                                    accept="application/pdf,image/*"
                                    required
                                    style={{
                                      width: '100%',
                                      padding: '8px',
                                      border: '2px dashed #ddd',
                                      borderRadius: '6px',
                                      marginBottom: '10px'
                                    }}
                                  />
                                  <small style={{ color: '#666' }}>
                                    Accepted formats: PDF, JPG, PNG (Max 5MB)
                                  </small>
                                </div>
                                <button 
                                  type="submit"
                                  style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  📤 Upload Certificate
                                </button>
                              </form>
                            </div>
                          ) : (
                            <div className="empty" style={{
                              padding: '40px',
                              textAlign: 'center',
                              backgroundColor: '#fff3cd',
                              borderRadius: '8px',
                              color: '#856404',
                              border: '1px solid #ffeaa7'
                            }}>
                              🔒 Certificate Upload Not Available
                              <br />
                              <small>You can upload your certificate after the event ends on {new Date(req.end_date).toLocaleDateString()}</small>
                            </div>
                          )
                        ) : (
                          // View mode - show the uploaded certificate
                          <PDFViewer 
                            requestId={req.request_id || req.event_id}
                            title={req.event_name}
                            type="certificate"
                          />
                        )}
                      </>
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

export default Achievements;
