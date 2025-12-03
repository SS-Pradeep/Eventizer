import React, { useState } from "react";
import './css/search.css';

const StudentSearch = () => {
    const [name, setName] = useState("");
    const [roll, setRoll] = useState("");
    const [year, setYear] = useState("");
    const [className, setClassName] = useState("");
    const [section, setSection] = useState("");
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [eventStats, setEventStats] = useState([]);
    const [loading, setLoading] = useState(false);

    // Format date helper function
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get student details and certificates
    const getStudentDetails = async (studentId) => {
        setLoading(true);
        try {
            // Get student basic details
            const studentResponse = await fetch(`http://localhost:3000/api/students/${studentId}`);
            if (!studentResponse.ok) {
                throw new Error('Failed to fetch student details');
            }
            const studentData = await studentResponse.json();
            
            // Get student certificate details
            const certificateResponse = await fetch(`http://localhost:3000/api/students/${studentId}/certificates`);
            if (!certificateResponse.ok) {
                throw new Error('Failed to fetch certificate data');
            }
            const certificateData = await certificateResponse.json();
            
            setSelectedStudent(studentData.student);
            setEventStats(certificateData.certificates || []);
            
        } catch (err) {
            console.error('Error fetching student details:', err);
            setSelectedStudent(null);
            setEventStats([]);
        } finally {
            setLoading(false);
        }
    };

    // Search students
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSelectedStudent(null);
        setEventStats([]);

        try {
            const params = new URLSearchParams();
            if (name) params.append('name', name);
            if (roll) params.append('roll', roll);
            if (year) params.append('year', year);
            if (className) params.append('class', className);
            if (section) params.append('section', section);

            const url = `http://localhost:3000/api/students/search?${params.toString()}`;
            const response = await fetch(url, { method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setStudents(result.students);
            } else {
                setStudents([]);
                console.warn(result.message || "No students found");
            }
        } catch (err) {
            console.error("Error searching students:", err);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h2>Student Search</h2>

            {/* Search Form */}
            <form onSubmit={handleSearch} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '20px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
            }}>
                <input
                    type="text"
                    placeholder="Enter Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />
                <input
                    type="text"
                    placeholder="Enter Roll Number"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />
                <input
                    type="text"
                    placeholder="Enter Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />
                
                <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">Select Class</option>
                    <option value="I">Class I</option>
                    <option value="II">Class II</option>
                    <option value="III">Class III</option>
                    <option value="IV">Class IV</option>
                    <option value="V">Class V</option>
                </select>

                <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">Select Section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="No">No Section</option>
                </select>

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </form>

            {/* Search Results */}
            {students.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>Results ({students.length} found)</h3>
                    <div style={{
                        display: 'grid',
                        gap: '10px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px'
                    }}>
                        {students.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => getStudentDetails(student.id)}
                                style={{
                                    cursor: "pointer",
                                    padding: "15px",
                                    borderRadius: "8px",
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e9ecef",
                                    transition: "all 0.2s",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f0f8ff';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ffffff';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ fontSize: '16px', color: '#007bff' }}>
                                            {student.name}
                                        </strong>
                                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                                            Roll: {student.roll_number} | Class: {student.class_name} {student.section} | Year: {student.year}
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        padding: '5px 10px',
                                        borderRadius: '15px',
                                        fontSize: '12px'
                                    }}>
                                        Click to view
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Student Detail Panel */}
            {selectedStudent && (
                <div className="student-preview-panel" style={{
                    border: "2px solid #007bff",
                    padding: "20px",
                    marginTop: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#f8f9fa",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}>
                    {/* Student Header */}
                    <div className="student-header" style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                        paddingBottom: "15px",
                        borderBottom: "2px solid #e9ecef"
                    }}>
                        <div>
                            <h3 style={{ color: "#007bff", margin: "0 0 5px 0", fontSize: "24px" }}>
                                {selectedStudent.name}
                            </h3>
                            <p style={{ margin: "0", color: "#666", fontSize: "16px" }}>
                                Roll: {selectedStudent.roll} | Class: {selectedStudent.class_name} {selectedStudent.section} | Year: {selectedStudent.year}
                            </p>
                            {selectedStudent.email && (
                                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
                                    Email: {selectedStudent.email}
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={() => setSelectedStudent(null)}
                            style={{
                                background: "none",
                                border: "2px solid #dc3545",
                                borderRadius: "50%",
                                width: "35px",
                                height: "35px",
                                cursor: "pointer",
                                color: "#dc3545",
                                fontSize: "16px",
                                fontWeight: "bold"
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Certificate Summary */}
                    <div className="certificate-summary" style={{
                        backgroundColor: "#e7f3ff",
                        padding: "15px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "1px solid #b3d9ff"
                    }}>
                        <h4 style={{ margin: "0 0 10px 0", color: "#0056b3", fontSize: "18px" }}>
                            📊 Certificate Summary
                        </h4>
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                            <div style={{ fontSize: "14px" }}>
                                <strong>Total Certificates:</strong> {eventStats.length}
                            </div>
                            <div style={{ fontSize: "14px" }}>
                                <strong>Total Participations:</strong> {eventStats.reduce((sum, cert) => sum + parseInt(cert.event_count || 1), 0)}
                            </div>
                            <div style={{ fontSize: "14px" }}>
                                <strong>Categories:</strong> {new Set(eventStats.map(cert => cert.event_type)).size}
                            </div>
                        </div>
                    </div>

                    {/* Certificates List */}
                    {eventStats && eventStats.length > 0 ? (
                        <div className="certificates-section">
                            <h4 style={{ color: "#28a745", marginBottom: "15px", fontSize: "20px" }}>
                                🏆 Certificates & Achievements
                            </h4>
                            
                            <div className="certificates-grid" style={{
                                display: "grid",
                                gap: "15px",
                                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))"
                            }}>
                                {eventStats.map((certificate, index) => (
                                    <div key={index} className="certificate-card" style={{
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "15px",
                                        backgroundColor: "#ffffff",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                    }}>
                                        {/* Certificate Header */}
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: "10px"
                                        }}>
                                            <h5 style={{
                                                margin: "0",
                                                color: "#007bff",
                                                fontSize: "16px",
                                                fontWeight: "bold",
                                                lineHeight: "1.2"
                                            }}>
                                                {certificate.event_name}
                                            </h5>
                                            <span style={{
                                                backgroundColor: "#007bff",
                                                color: "white",
                                                padding: "4px 8px",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                                fontWeight: "bold",
                                                minWidth: "30px",
                                                textAlign: "center"
                                            }}>
                                                {certificate.event_count || 1}x
                                            </span>
                                        </div>

                                        {/* Certificate Details */}
                                        <div className="certificate-details">
                                            <div style={{ marginBottom: "8px" }}>
                                                <strong>Type:</strong> 
                                                <span style={{
                                                    marginLeft: "8px",
                                                    padding: "2px 6px",
                                                    backgroundColor: "#f8f9fa",
                                                    borderRadius: "4px",
                                                    fontSize: "12px"
                                                }}>
                                                    {certificate.event_type}
                                                </span>
                                            </div>
                                            
                                            {certificate.event_level && (
                                                <div style={{ marginBottom: "8px", fontSize: "14px" }}>
                                                    <strong>Level:</strong> 
                                                    <span style={{ marginLeft: "8px", color: "#666" }}>
                                                        {certificate.event_level}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {certificate.organizer && (
                                                <div style={{ marginBottom: "8px", fontSize: "14px" }}>
                                                    <strong>Organizer:</strong> 
                                                    <span style={{ marginLeft: "8px", color: "#666" }}>
                                                        {certificate.organizer}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {certificate.duration && (
                                                <div style={{ marginBottom: "8px", fontSize: "14px" }}>
                                                    <strong>Duration:</strong> 
                                                    <span style={{ marginLeft: "8px", color: "#666" }}>
                                                        {certificate.duration}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {certificate.start_date && (
                                                <div style={{ fontSize: "12px", color: "#888" }}>
                                                    <strong>Date:</strong> {formatDate(certificate.start_date)}
                                                    {certificate.end_date && certificate.end_date !== certificate.start_date && 
                                                     ` - ${formatDate(certificate.end_date)}`
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Category Summary */}
                            <div className="category-summary" style={{
                                marginTop: "20px",
                                padding: "15px",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "8px",
                                border: "1px solid #e9ecef"
                            }}>
                                <h5 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>📈 By Category:</h5>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                    {Object.entries(
                                        eventStats.reduce((acc, cert) => {
                                            const type = cert.event_type || 'Other';
                                            acc[type] = (acc[type] || 0) + parseInt(cert.event_count || 1);
                                            return acc;
                                        }, {})
                                    ).map(([type, count]) => (
                                        <span key={type} style={{
                                            backgroundColor: "#007bff",
                                            color: "white",
                                            padding: "5px 10px",
                                            borderRadius: "15px",
                                            fontSize: "12px",
                                            fontWeight: "bold"
                                        }}>
                                            {type}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#666",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            border: "2px dashed #ddd"
                        }}>
                            <div style={{ fontSize: "48px", marginBottom: "10px" }}>📋</div>
                            <p style={{ margin: "0", fontSize: "16px" }}>
                                No certificates found for this student.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && !selectedStudent && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                    <p>🔍 Searching for students...</p>
                </div>
            )}

            {/* No Results */}
            {!loading && students.length === 0 && (name || roll || year || className || section) && (
                <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                    <p>No students found matching your search criteria.</p>
                </div>
            )}
        </div>
    );
};

export default StudentSearch;