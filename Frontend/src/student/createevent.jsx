import { useState } from "react";
import { useNavigate } from "react-router-dom";
import auth  from "../config/firebase-config";
import './createevent.css';
const Createevent = () => {
  const [event_name, SetName] = useState("");
  const [eventype, SetType] = useState("");
  const [description, SetDes] = useState("");
  const [st_date, SetstDate] = useState("");
  const [end_date, SetendDate] = useState("");
  const [permissionrequired, SetPermission] = useState(false);
  const [Certificateupload, SetCertificate] = useState(false);
  const [Organizer, SetOrganizer] = useState("");
  const [event_level, SetLevel] = useState("");

  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [success, setSuccess] = useState(false);

  const user = auth.currentUser;
  const uid = user.uid;

  const navigate = useNavigate();

  const handlesubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    

    if (
      (event_level !== "Intra college" && event_level !== "Inter college") ||
      event_level === "Hackathon"
    ) {
      SetPermission(true);
    }

    const eventData = {
      name: event_name,
      event_type: eventype,
      description,
      st_date,
      end_date,
      permissionrequired,
      event_level,
      certificate_upload: Certificateupload,
      organizer: Organizer,
    };

    try {
  // Step 1: Store event
  const response = await fetch("http://localhost:3000/eventregister", {
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
  
  // ✅ Parse the JSON response first
  const eventResult = await response.json();
  console.log('Event result:', eventResult);
  
  // ✅ Get the actual event_id from the parsed response
  const event_id = eventResult.id || eventResult.event_id || eventResult.insertId;
  
  if (!event_id) {
    throw new Error("No event_id received from server");
  }

  // Step 2: Generate PDF
  const pdf_data = {
    event_id,
    st_date,
    end_date,
    reason: description || "Event",
    request_id: Date.now(),
  };

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

  if (pdfResult.success) {
    setPdfUrl(pdfResult.data.url);
    setSuccess(true);
  }
} catch (err) {
  console.error("Error:", err);
  alert("Something went wrong. Try again.");
} finally {
  setLoading(false);
}};

  return (
    <div id="mainevent">
      {!success ? (
        <form id="form" onSubmit={handlesubmit}>
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
            />
          </label>
          <br />

          <label>
            Start Date:
            <input
              type="date"
              value={st_date}
              onChange={(e) => SetstDate(e.target.value)}
            />
          </label>
          <br />

          <label>
            End Date:
            <input
              type="date"
              value={end_date}
              onChange={(e) => SetendDate(e.target.value)}
            />
          </label>
          <br />

          <label>
            Organizer:
            <input
              type="text"
              value={Organizer}
              onChange={(e) => SetOrganizer(e.target.value)}
            />
          </label>
          <br />

          <label>
            Event Level:
            <select
              value={event_level}
              onChange={(e) => SetLevel(e.target.value)}
            >
              <option value="">Select Level</option>
              <option value="Intra college">Intra college</option>
              <option value="Inter college">Inter college</option>
              <option value="local">Local</option>
              <option value="National">National</option>
              <option value="International">International</option>
            </select>
          </label>
          <br />

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      ) : (
        <div className="mt-6">
          <h3>Preview Generated Letter</h3>
          <iframe
            src={pdfUrl}
            title="Letter Preview"
            width="100%"
            height="500px"
            style={{ border: "1px solid #ccc", borderRadius: "8px" }}
          ></iframe>

          <button
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            onClick={() => navigate(`/student/${uid}`)}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default Createevent;
