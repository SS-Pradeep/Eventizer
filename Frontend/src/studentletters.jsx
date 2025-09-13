import { useEffect, useState } from "react";
import auth from "./config/firebase-config";

const Studentletters = () => {
  const uid = auth.currentUser?.uid;    
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Fetch student's requests from backend
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

        const data = await res.json();
        console.log("Fetched student requests:", data);
        setRequests(data);
      } catch (e) {
        console.error("Error fetching requests:", e);
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
                  <span
                    className={`status status--${req.permission_letter_status}`}
                  >
                    {req.permission_letter_status}
                  </span>
                </div>
                <p className="letter-desc">
                  Organiser: {req.organiser} <br />
                  End Date: {new Date(req.end_date).toLocaleDateString()}
                </p>
              </div>

              {expandedId === req.event_id && (
                <div className="preview-inline">
                  <div className="preview-header">
                    <h3 className="preview-title">{req.event_name}</h3>
                    <p>
                      Organiser: <b>{req.organiser}</b>
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
                    </p>
                  </div>
                  <div className="preview-body">
                    <div className="empty">
                      Permission letter preview will be available once uploaded.
                    </div>
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
