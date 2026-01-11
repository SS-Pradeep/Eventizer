import { useEffect, useState } from "react";
import auth from "../config/firebase-config";
import "./css/studentletters.css";

const Studentletters = () => {
  const uid = auth.currentUser?.uid;

  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // DELETE POPUP STATES
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH REQUESTS ================= */
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3000/requeststudent/${uid}?status=${filter}`
        );

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const response = await res.json();
        if (response.success && response.data) {
          setRequests(response.data);
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

    if (uid) fetchRequests();
  }, [uid, filter]);

  /* ================= OPEN DELETE POPUP ================= */
  const openDeletePopup = (e, req) => {
    e.stopPropagation();
    setDeleteTarget(req);
    setShowDeletePopup(true);
  };

  /* ================= CONFIRM DELETE ================= */
  const confirmDelete = async () => {
  if (!deleteTarget) return;

  const target = deleteTarget;

  // CLOSE POPUP
  setShowDeletePopup(false);
  setDeleteTarget(null);

  // REMOVE FROM UI
  setRequests(prev =>
    prev.filter(r => r.event_id !== target.event_id)
  );
  setExpandedId(null);

  try {
    setDeleting(true);

    const res = await fetch(
      `http://localhost:3000/requeststudent/delete`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(target),
      }
    );

    if (!res.ok) {
      throw new Error("Delete failed");
    }

    // ✅ NO rollback
  } catch (err) {
    console.error("Delete error:", err);
  } finally {
    setDeleting(false);
  }
};


  return (
    <div className="mainapproval">
      {/* ================= TOP BAR ================= */}
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

      {/* ================= LIST ================= */}
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
                  setExpandedId(
                    expandedId === req.event_id ? null : req.event_id
                  )
                }
              >
                <div className="letter-card__header">
                  <h3 className="letter-title">{req.event_name}</h3>

                  <div className="status-container">
                    <span
                      className={`status status--${req.permission_letter_status}`}
                    >
                      {req.permission_letter_status}
                    </span>

                    {/* DELETE BUTTON ONLY FOR PENDING */}
                    {req.permission_letter_status === "pending" && (
                      <button
                        className="delete-btn"
                        onClick={(e) => openDeletePopup(e, req)}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>

                <p className="letter-desc">
                  Organiser: {req.organizer} <br />
                  End Date:{" "}
                  {new Date(req.end_date).toLocaleDateString()}
                </p>
              </div>

              {expandedId === req.event_id && (
                <div className="preview-inline">
                  <div className="preview-header">
                    <h3>{req.event_name}</h3>
                    <p>
                      Organiser: <b>{req.organizer}</b>
                    </p>
                    <p>Status: {req.permission_letter_status}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ================= DELETE POPUP ================= */}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Delete Request</h3>
            <p>
              Are you sure you want to delete
              <b> "{deleteTarget?.event_name}" </b>?
            </p>

            <div className="popup-actions">
              <button
                className="popup-cancel"
                onClick={() => {
                  setShowDeletePopup(false);
                  setDeleteTarget(null);
                }}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="popup-delete"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studentletters;
