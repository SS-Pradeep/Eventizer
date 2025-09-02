import React, { useState } from "react";

function StudentSearch() {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [year, setYear] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔍 Search students
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/searchstudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roll, year }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setStudents(result);
    } catch (err) {
      console.error("Error searching students:", err);
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  // 👤 Get full student details
  const getStudentDetails = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/students/${id}`);
      const result = await response.json();
      setSelectedStudent(result);
    } catch (err) {
      console.error("Error fetching student:", err);
      alert("Failed to fetch student details");
    }
  };

  return (
    <div>
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

      <h3>Results</h3>
      <ul>
        {students.map((student) => (
          <li
            key={student.id}
            onClick={() => getStudentDetails(student.id)}
            style={{ cursor: "pointer", marginBottom: "8px" }}
          >
            {student.name} ({student.roll}) - Year: {student.year}
          </li>
        ))}
      </ul>

      {selectedStudent && (
        <div
          style={{
            border: "1px solid gray",
            padding: "10px",
            marginTop: "15px",
            borderRadius: "8px",
          }}
        >
          <h3>Student Details</h3>
          <p><b>Name:</b> {selectedStudent.name}</p>
          <p><b>Roll:</b> {selectedStudent.roll}</p>
          <p><b>Year:</b> {selectedStudent.year}</p>
          <p><b>Email:</b> {selectedStudent.email}</p>
          <p><b>Department:</b> {selectedStudent.department}</p>
          <p><b>DOB:</b> {selectedStudent.dob}</p>
        </div>
      )}
    </div>
  );
}

export default StudentSearch;
