import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import auth from "./config/firebase-config";
import "./css/letterapproval.css";

export default function AdminLetterApproval() {
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [user, setUser] = useState(null);
  const [uid, setUid] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUid(currentUser ? currentUser.uid : null);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  /* ================= FETCH REQUESTS ================= */
  useEffect(() => {
    if (!authChecked || !uid) {
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:3000/api/requests?status=${filter}&uid=${uid}`,
          { headers: { Accept: "application/json" } }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          setRequests(data.data || []);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [filter, uid, authChecked]);

  /* ================= UPDATE STATUS ================= */
  const handleStatusChange = async (requestId, newStatus) => {
  if (!uid) return;

  try {
    const res = await fetch(
      `http://localhost:3000/api/requests/${requestId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: newStatus, uid }),
      }
    );

    if (!res.ok) throw new Error("Update failed");

    /* ✅ FIX: remove request immediately if in pending view */
    if (filter === "pending") {
      setRequests(prev =>
        prev.filter(r => r.request_id !== requestId)
      );
    } else {
      setRequests(prev =>
        prev.map(r =>
          r.request_id === requestId
            ? { ...r, status: newStatus, permission_letter_status: newStatus }
            : r
        )
      );
    }

    setExpandedId(null);

  } catch (err) {
    console.error("Status update error:", err);
  }
};


  /* ================= AUTH STATES ================= */
  if (!authChecked) {
    return (
      <div className="mainapproval">
        <div className="empty">Checking authentication…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mainapproval">
        <div className="empty">Please log in to access this page.</div>
      </div>
    );
  }

  /* ================= UI ================= */
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
                  Roll No: {req.roll_number}<br />
                  Event: {req.event_name}<br />
                  Type: {req.event_type}
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

              {expandedId === req.request_id && (
                <div className="preview-inline">
                  <div className="preview-header">
                    <h3>{req.student_name}</h3>
                    <p>Organizer: <b>{req.organizer}</b></p>
                    <p>Level: <b>{req.event_level}</b></p>
                    <p>Dates: {req.start_date} → {req.end_date}</p>
                  </div>

                  <div className="preview-body">
                    {req.letter_url ? (
                      <div className="empty">
                        📄 Permission letter available<br />
                        <a
                          href={req.letter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Click to view document
                        </a>
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
