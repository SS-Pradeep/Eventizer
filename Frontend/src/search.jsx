import React, { useState, useEffect } from "react";
import "./Search.css";

const Search = () => {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [year, setYear] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch all students initially
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (filters = {}) => {
    try {
      let query = new URLSearchParams(filters).toString();
      const res = await fetch(`http://localhost:5000/students?${query}`);
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSearch = () => {
    fetchStudents({ name, roll, year });
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  const handleCloseProfile = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="mainsearch" onClick={handleCloseProfile}>
      <div className="topsearch" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          placeholder="Search by Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Roll Number"
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="bottomsearch" onClick={(e) => e.stopPropagation()}>
        {!selectedStudent ? (
          <div className="student-list">
            {students.length > 0 ? (
              students.map((s) => (
                <div
                  key={s.uid}
                  className="student-card"
                  onClick={() => handleSelectStudent(s)}
                >
                  <p>
                    <strong>{s.name}</strong> ({s.rollNumber})
                  </p>
                  <p>Year: {s.graduationYear}</p>
                </div>
              ))
            ) : (
              <p>No students found</p>
            )}
          </div>
        ) : (
          <div className="student-profile">
            <h3>{selectedStudent.name}</h3>
            <p>Roll: {selectedStudent.rollNumber}</p>
            <p>Year: {selectedStudent.graduationYear}</p>
            <p>Email: {selectedStudent.email}</p>
            <p>Department: {selectedStudent.department}</p>
            <button onClick={handleCloseProfile}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
