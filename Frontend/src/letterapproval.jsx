import { useEffect, useState } from "react";
//import { Document, Page, pdfjs } from "react-pdf";

// PDF worker
//pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function AdminLetterApproval() {
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // ✅ Updated fetch URL to match backend endpoint
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3000/request?status=${filter}` // Changed from /requests to /request
        );

        
        

        if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Received data:', data);
        setRequests(data);
      } catch (e) {
        console.error("Error fetching requests:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [filter]);

  // ✅ Updated status change URL to match backend endpoint
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await fetch(`http://localhost:3000/request/${requestId}/status`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId
            ? { ...r, permission_letter_status: newStatus }
            : r
        )
      );

      if (expandedId === requestId) {
        setExpandedId((prev) =>
          prev
            ? { ...prev, permission_letter_status: newStatus }
            : prev
        );
      }
    } catch (e) {
      console.error("Error updating request:", e);
    }
  };

  const onPdfLoad = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Rest of your component remains the same...
  return (
    <div className="mainapproval">
      {/* Your existing JSX code remains unchanged */}
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
                    className={`status status--${req.permission_letter_status}`}
                  >
                    {req.permission_letter_status}
                  </span>
                </div>
                <p className="letter-desc">
                  {req.event_name} ({req.event_level})
                </p>

                {filter === "pending" && (
                  <div
                    className="actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-accept"
                      onClick={() =>
                        handleStatusChange(req.request_id, "accepted")
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

              {/* Rest of your expanded view code remains the same */}
              {expandedId === req.request_id && (
                <div className="preview-inline">
                  <div className="preview-header">
                    <h3 className="preview-title">{req.student_name}</h3>
                    <p className="preview-meta">
                      Event: <b>{req.event_name}</b> ({req.event_level})
                    </p>
                    <p>
                      Status:{" "}
                      <span
                        className={`status status--${req.permission_letter_status}`}
                      >
                        {req.permission_letter_status}
                      </span>
                    </p>

                    {req.permission_letter_status === "pending" && (
                      <div className="preview-actions">
                        <button
                          className="btn btn-accept"
                          onClick={() =>
                            handleStatusChange(req.request_id, "accepted")
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
