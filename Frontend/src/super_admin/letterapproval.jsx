import { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {auth} from "../config/firebase-config";
import "./css/letterapproval.css";

export default function SuperAdminLetterApproval() {
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [updating, setUpdating] = useState(false);

  const [uid, setUid] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  /* ================= GROUPED REQUESTS ================= */
  const groupedRequests = useMemo(() => {
    return requests.reduce((groups, request) => {
      const key = request.event_name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(request);
      return groups;
    }, {});
  }, [requests]);

  /* ================= FETCH ================= */
  const fetchRequests = useCallback(async () => {
    if (!uid) return;

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/api/superrequest?status=${filter}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setRequests(data.success ? data.data || [] : []);
      setSelectedRequests(new Set());
    } catch (err) {
      console.error("Fetch error:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter, uid]);

  useEffect(() => {
    if (authChecked && uid) fetchRequests();
    if (authChecked && !uid) setLoading(false);
  }, [authChecked, uid, fetchRequests]);

  /* ================= UPDATE ================= */
  const handleUpdate = useCallback(async (requestIds, newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(
        "http://localhost:3000/api/superrequests/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestIds: Array.isArray(requestIds) ? requestIds : [requestIds],
            status: newStatus,
          }),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      const result = await res.json();

      if (result.success) {
        setRequests((prev) =>
          prev.filter((r) => !result.updated.includes(r.request_id))
        );

        setSelectedRequests((prev) => {
          const next = new Set(prev);
          result.updated.forEach((id) => next.delete(id));
          return next;
        });
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Update failed");
    } finally {
      setUpdating(false);
    }
  }, []);

  /* ================= SELECTION HELPERS ================= */
  const handleRequestSelect = (id, checked) => {
    setSelectedRequests((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleSelectAllInGroup = (event, checked) => {
    setSelectedRequests((prev) => {
      const next = new Set(prev);
      groupedRequests[event].forEach((r) =>
        checked ? next.add(r.request_id) : next.delete(r.request_id)
      );
      return next;
    });
  };

  const isGroupFullySelected = (event) =>
    groupedRequests[event]?.every((r) =>
      selectedRequests.has(r.request_id)
    );

  const isGroupPartiallySelected = (event) => {
    const group = groupedRequests[event];
    const count = group.filter((r) =>
      selectedRequests.has(r.request_id)
    ).length;
    return count > 0 && count < group.length;
  };

  const toggleGroup = (event) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(event) ? next.delete(event) : next.add(event);
      return next;
    });
  };

  /* ================= AUTH STATES ================= */
  if (!authChecked) {
    return <div className="empty">Checking authentication…</div>;
  }

  if (!uid) {
    return <div className="empty">Please login to continue.</div>;
  }

  /* ================= UI ================= */
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

      {filter === "pending" && selectedRequests.size > 0 && (
        <div className="bulk-actions">
          <span>{selectedRequests.size} selected</span>
          <button
            className="btn btn-accept"
            onClick={() =>
              handleUpdate(Array.from(selectedRequests), "approved")
            }
            disabled={updating}
          >
            Accept
          </button>
          <button
            className="btn btn-reject"
            onClick={() =>
              handleUpdate(Array.from(selectedRequests), "rejected")
            }
            disabled={updating}
          >
            Reject
          </button>
        </div>
      )}

      <div className="letterslist">
        {loading ? (
          <div className="empty">Loading requests…</div>
        ) : Object.keys(groupedRequests).length === 0 ? (
          <div className="empty">No {filter} requests found.</div>
        ) : (
          Object.entries(groupedRequests).map(([event, list]) => (
            <div key={event} className="event-group">
              <div className="group-header">
                <button onClick={() => toggleGroup(event)}>
                  {expandedGroups.has(event) ? "▼" : "▶"}
                </button>

                {filter === "pending" && (
                  <input
                    type="checkbox"
                    checked={isGroupFullySelected(event)}
                    ref={(el) =>
                      el &&
                      (el.indeterminate =
                        isGroupPartiallySelected(event))
                    }
                    onChange={(e) =>
                      handleSelectAllInGroup(event, e.target.checked)
                    }
                  />
                )}

                <h3>{event} ({list.length})</h3>
              </div>

              {expandedGroups.has(event) &&
                list.map((req) => (
                  <div key={req.request_id} className="letter-card">
                    {filter === "pending" && (
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(req.request_id)}
                        onChange={(e) =>
                          handleRequestSelect(
                            req.request_id,
                            e.target.checked
                          )
                        }
                      />
                    )}
                    <h4>{req.name}</h4>
                    <p>
                      {req.roll_number} • {req.event_type}
                    </p>
                  </div>
                ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
