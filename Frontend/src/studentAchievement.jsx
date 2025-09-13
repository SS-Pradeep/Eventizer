import { useState, useEffect } from "react";
import auth from "./config/firebase-config";

const Achievements = () => {
  const uid = auth.currentUser?.uid;
  const [filter, setFilter] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Fetch student's requests from backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:3000/certificateshow/${uid}/${filter}`
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

  // ✅ Fixed handleSubmit
  const handleSubmit = async (e, eventId) => {
    e.preventDefault(); // prevent refresh

    const fileInput = e.target.elements.file;
    if (!fileInput.files.length) {
      alert("Please select a file first.");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("certificate", file);
    formData.append("event_id", eventId);

    try {
      const res = await fetch(`http://localhost:3000/upload-certificate/${expandedId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      console.log("Upload success:", data);
    } catch (err) {
      console.error("Upload error:", err);
    }
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
        ) : requests.length === 0 ? (
          <div className="empty">No requests found.</div>
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
                  setExpandedId(
                    expandedId === req.event_id ? null : req.event_id
                  )
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
                  Event Name: {req.event_name} <br />
                  End Date: {new Date(req.end_date).toLocaleDateString()}
                </p>
              </div>

              {expandedId === req.event_id && (
                <div className="preview-inline">
                  <div className="preview-header">
                    <h3 className="preview-title">{req.event_name}</h3>
                    <p>
                      Event Name: <b>{req.event_name}</b>
                    </p>
                    <p>
                      End Date: {new Date(req.end_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="preview-body">
  {/* Show upload form only when filter = false (Not uploaded certificates) */}
  {!filter ? (
    <form onSubmit={(e) => handleSubmit(e, req.event_id)}>
      <input
        type="file"
        name="file"
        accept="application/pdf,image/*"
      />
      <button type="submit">Upload</button>
    </form>
  ) : (
    <p className="uploaded-msg">✅ Certificate already uploaded</p>
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
