import React, { useState } from "react";
import './search.css';

const StudentSearch = ()=> {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [year, setYear] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [eventStats, setEventStats] = useState([]); // Missing state variable
  const [loading, setLoading] = useState(false);

  // Search students
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSelectedStudent(null); // Clear previous selection
    setEventStats([]); // Clear previous event stats
    
    const data = {
      name: name,
      roll: roll,
      year: year
    };

    try {
      const response = await fetch("http://localhost:3000/searchstudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setStudents(result);
    } catch (err) {
      console.error("Error searching students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get student details and event statistics
  const getStudentDetails = async (id) => {
    try {
      // Fetch student details from your student endpoint
      // Fetch event statistics using the searchstudent endpoint
      const statsResponse = await fetch(`http://localhost:3000/searchstudent/${id}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setEventStats(statsData);
      } else {
        setEventStats([]);
      }
    } catch (err) {
      console.error("Error fetching student details:", err);
      setSelectedStudent(null);
      setEventStats([]);
    }
  };

  return (
    <div className="app-container">
      <h2>Student Search</h2>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Roll Number"
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Search Results */}
      {students.length > 0 && (
        <>
          <h3>Results ({students.length} found)</h3>
          <ul>
            {students.map((student) => (
              <li
                key={student.id}
                onClick={() => getStudentDetails(student.id)}
                style={{ 
                  cursor: "pointer", 
                  marginBottom: "8px",
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef"
                }}
              >
                <strong>{student.name}</strong> ({student.roll}) - Year: {student.year}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Combined Student Details and Event Statistics */}
      {selectedStudent && (
        <div
          style={{
            border: "2px solid #007bff",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "8px",
            backgroundColor: "#f8f9fa"
          }}
        >
          {/* Student Basic Information */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ color: "#007bff", marginBottom: "10px" }}>Student Information</h3>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <p><b>Name:</b> {selectedStudent.name}</p>
              <p><b>Roll Number:</b> {selectedStudent.roll}</p>
              <p><b>Class/Year:</b> {selectedStudent.year}</p>
              {selectedStudent.email && <p><b>Email:</b> {selectedStudent.email}</p>}
            </div>
          </div>

          {/* Event Statistics Section */}
          {eventStats && eventStats.length > 0 ? (
            <div>
              <h3 style={{ color: "#28a745", marginBottom: "15px" }}>Event Participation</h3>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                marginTop: "10px"
              }}>
                <thead>
                  <tr>
                    <th style={{ 
                      border: "1px solid #ddd", 
                      padding: "12px", 
                      backgroundColor: "#e9ecef",
                      textAlign: "left",
                      fontWeight: "bold"
                    }}>
                      Event Name
                    </th>
                    <th style={{ 
                      border: "1px solid #ddd", 
                      padding: "12px", 
                      backgroundColor: "#e9ecef",
                      textAlign: "center",
                      fontWeight: "bold"
                    }}>
                      Participation Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eventStats.map((event, index) => (
                    <tr key={index} style={{ 
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" 
                    }}>
                      <td style={{ 
                        border: "1px solid #ddd", 
                        padding: "12px"
                      }}>
                        {event.event_name}
                      </td>
                      <td style={{ 
                        border: "1px solid #ddd", 
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#007bff"
                      }}>
                        {event.event_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Summary Statistics */}
              <div style={{ 
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#e7f3ff",
                borderRadius: "5px",
                border: "1px solid #b3d9ff"
              }}>
                <p style={{ margin: "0", fontWeight: "bold", color: "#0056b3" }}>
                  📊 Total Events Participated: {eventStats.length}
                </p>
                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
                  Total Participations: {eventStats.reduce((sum, event) => sum + parseInt(event.event_count), 0)}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: "center", 
              padding: "20px",
              color: "#666"
            }}>
              <p>📋 No event participation records found for this student.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>🔍 Searching for students...</p>
        </div>
      )}

      {!loading && students.length === 0 && name && (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          <p>No students found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default StudentSearch;
