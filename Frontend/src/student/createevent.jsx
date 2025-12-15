import { useState } from "react";
import { useNavigate } from "react-router-dom";
import auth from "../config/firebase-config";
import './css/createevent.css';

const Createevent = () => {
  const [event_name, SetName] = useState("");
  const [eventype, SetType] = useState("");
  const [description, SetDes] = useState("");
  const [st_date, SetstDate] = useState("");
  const [end_date, SetendDate] = useState("");
  const [Organizer, SetOrganizer] = useState("");
  const [event_level, SetLevel] = useState("");

  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [success, setSuccess] = useState(false);

  const user = auth.currentUser;
  const uid = user?.uid;
  const navigate = useNavigate();

  const handlesubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Calculate permission requirement
    const needsPermission = event_level !== "course";

    const eventData = {
      event_name: event_name,
      event_type: eventype,
      description: description,
      start_date: st_date,
      end_date: end_date,
      permissionrequired: needsPermission,
      event_level: event_level,
      Certificate_upload: false, 
      organizer: Organizer
    };

    console.log('Sending event data:', eventData);

    try {
      // Step 1: Store event
      const response = await fetch("http://localhost:3000/api/eventregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Event registration error:', errorText);
        throw new Error("Failed to register event in DB");
      }

      const eventResult = await response.json();
      console.log('Event result:', eventResult);
      
      // ✅ If no permission required, navigate directly
      
      
      // Get the event_id from response
      const event_id = eventResult.event_id;
      
      if (!event_id) {
        throw new Error("No event_id received from server");
      }

      // Step 2: Generate PDF if permission required
      const pdf_data = {
        event_id,
        st_date,
        end_date,
        reason: description || `Participation in ${event_name}`,
      };

      let autoRes;   // declare here
      if (!needsPermission) {
        try {
          autoRes = await fetch("http://localhost:3000/auto-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: uid,
              event_id: event_id
            })
          });} catch (alertError) {
            console.log("Auto-request error:", alertError);
          }
          const autoData = await autoRes.json();
          if (!autoData.success) {
            alert("Auto request creation failed");
            return;
          }
            navigate(`/student/${uid}`);
            return;
          }
      console.log('PDF data being sent:', pdf_data);

      const pdfResponse = await fetch("http://localhost:3000/upload-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: uid,          
          pdfData: pdf_data
        })
      });

      console.log('PDF response status:', pdfResponse.status);

      if (!pdfResponse.ok) {
        const pdfError = await pdfResponse.text();
        console.log('PDF generation error:', pdfError);
        throw new Error("Failed to generate PDF");
      }

      const pdfResult = await pdfResponse.json();
      console.log('PDF result:', pdfResult);

      if (pdfResult.success) {
        // Generate the PDF URL for preview
        try {
          const pdfUrlResponse = await fetch(`http://localhost:3000/api/pdf/${pdfResult.data.request_id}`);
          const pdfUrlData = await pdfUrlResponse.json();
          
          if (pdfUrlData.success) {
            setPdfUrl(pdfUrlData.url);
            setSuccess(true);
          } else {
            alert("Event created and permission letter generated successfully!");
            navigate(`/student/${uid}`);
          }
        } catch (urlError) {
          console.log('PDF URL error:', urlError);
          alert("Event created and permission letter generated successfully!");
          navigate(`/student/${uid}`);
        }
      } else {
        throw new Error("PDF generation failed");
      }
      
    } catch (err) {
      console.error("Error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="mainevent">
      {!success ? (
        <form id="form" onSubmit={handlesubmit}>
          <h2>Create New Event</h2>
          
          <label>
            Event Name:
            <input
              type="text"
              value={event_name}
              onChange={(e) => SetName(e.target.value)}
              required
            />
          </label>
          <br />

          <label>
            Event Type:
            <input
              type="text"
              value={eventype}
              onChange={(e) => SetType(e.target.value)}
              required
            />
          </label>
          <br />

          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => SetDes(e.target.value)}
              placeholder="Brief description of the event"
            />
          </label>
          <br />

          <label>
            Start Date:
            <input
              type="date"
              value={st_date}
              onChange={(e) => SetstDate(e.target.value)}
              required
            />
          </label>
          <br />

          <label>
            End Date:
            <input
              type="date"
              value={end_date}
              onChange={(e) => SetendDate(e.target.value)}
              required
            />
          </label>
          <br />

          <label>
            Organizer:
            <input
              type="text"
              value={Organizer}
              onChange={(e) => SetOrganizer(e.target.value)}
              required
            />
          </label>
          <br />

          <label>
            Event Level:
            <select
              value={event_level}
              onChange={(e) => SetLevel(e.target.value)}
              required
            >
              <option value="">Select Level</option>
              <option value="course">Others (Permission not required)</option>
              <option value="Intra college">Intra college</option>
              <option value="Inter college">Inter college</option>
              <option value="local">Local</option>
              <option value="National">National</option>
              <option value="International">International</option>
            </select>
          </label>
          <br />

          {/* ✅ Info message instead of checkbox */}
          <div style={{
            padding: '10px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px',
            color: '#1565c0'
          }}>
            📋 <strong>Note:</strong> Certificate upload will be required after the event completion for all events.
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </form>
      ) : (
        <div className="success-container">
          <h3>✅ Event Created Successfully!</h3>
          <p>Your permission letter has been generated and submitted for approval.</p>
          <p><strong>Certificate upload will be available after the event ends.</strong></p>
          
          {pdfUrl && (
            <>
              <h4>Preview Permission Letter</h4>
              <iframe
                src={pdfUrl}
                title="Permission Letter Preview"
                width="100%"
                height="500px"
                style={{ border: "1px solid #ccc", borderRadius: "8px", margin: "20px 0" }}
              />
            </>
          )}

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => window.open(pdfUrl, '_blank')}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                marginRight: "10px",
                cursor: "pointer"
              }}
            >
              📄 Open Full View
            </button>
            <button
              onClick={() => navigate(`/student/${uid}`)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Createevent;
