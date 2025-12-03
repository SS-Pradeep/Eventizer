import { useEffect, useState } from "react";
import './css/assignment.css';
const Assignment = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setloading] = useState(true);
    const [error, Seterror] = useState(null);
    const [scheduleRows, setScheduleRows] = useState([
        { teacherId: '', className: '', sectionName: '' }
    ]);
    const [alreadyscheduled, setAlreadyscheduled] = useState([]);

    useEffect(() => {
        const fetchdata = async () => {
            try {
                setloading(true);
                const res = await fetch('http://localhost:3000/superadmin/getnamesandids');
                if (!res.ok) {
                    throw new Error(`HTTP ERROR Status: ${res.status}`);
                }
                const data = await res.json();
                setTeachers(data); 

                const response = await fetch('http://localhost:3000/superadmin/getassignments');
                if (!response.ok) {
                    throw new Error(`HTTP ERROR Status: ${response.status}`);
                }
                const assignmentData = await response.json();
                if (assignmentData.length > 0) {
                    setAlreadyscheduled(assignmentData.map(item => ({
                        teacherId: item.admin_id, 
                        teacherName: item.name, 
                        className: item.class_name,
                        sectionName: item.section
                    })));
                }
            } catch (err) {
                Seterror(err.message);
            } finally {
                setloading(false);
            }
        }
        fetchdata();
    }, []);

    // FIXED: Use Roman numerals and include 'No' section
    const classes = ['I', 'II', 'III', 'IV', 'V'];
    const sections = ['A', 'B', 'No'];

    const updateRow = (index, field, value) => {
        setScheduleRows(rows =>
            rows.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            )
        );
    };

    const addRow = () => {
        setScheduleRows([...scheduleRows, {
            teacherId: '',
            className: '',
            sectionName: ''
        }]);
    };

    const removeRow = (index) => {
        if (scheduleRows.length > 1) {
            setScheduleRows(rows => rows.filter((_, i) => i !== index));
        }
    };

    // Rest of your validation and submit logic remains the same...
    const validateAssignments = () => {
        const errors = [];
        
        const teacherIds = scheduleRows.map(row => row.teacherId).filter(id => id);
        const duplicateTeachers = teacherIds.filter((id, index) => teacherIds.indexOf(id) !== index);
        
        if (duplicateTeachers.length > 0) {
            const duplicateNames = duplicateTeachers.map(id => {
                const teacher = teachers.find(t => t.admin_id == id);
                return teacher ? teacher.name : id;
            });
            errors.push(`Duplicate teachers found: ${[...new Set(duplicateNames)].join(', ')}`);
        }

        const classSectionCombos = scheduleRows
            .filter(row => row.className && row.sectionName)
            .map(row => `${row.className}-${row.sectionName}`);
        
        const duplicateCombos = classSectionCombos.filter((combo, index) => 
            classSectionCombos.indexOf(combo) !== index
        );
        
        if (duplicateCombos.length > 0) {
            errors.push(`Duplicate class-section combinations: ${[...new Set(duplicateCombos)].join(', ')}`);
        }

        return errors;
    };

    const handlesubmit = async (e) => {
        e.preventDefault();
        
        const allRowsFilled = scheduleRows.every(row => 
            row.teacherId && row.className && row.sectionName
        );
        
        if (!allRowsFilled) {
            alert('Please fill all fields');
            return;
        }

        const validationErrors = validateAssignments();
        if (validationErrors.length > 0) {
            alert('Validation errors: ' + validationErrors.join(', '));
            return;
        }

        const scheduleData = {
            schedules: scheduleRows,
        };

        try {
            const response = await fetch("http://localhost:3000/superadmin/classassignment", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(scheduleData),
            });
            
            const result = await response.json();
            console.log('Server response:', result);
            
            if (response.ok) {
                console.log("assignment successful");
                alert('Class assignments completed successfully!');
                setScheduleRows([{ teacherId: '', className: '', sectionName: '' }]);
                // Refresh the existing assignments
                window.location.reload(); // Simple refresh to update the display
            } else {
                throw new Error(result.error || 'Assignment failed');
            }
        } catch (err) {
            console.error('Assignment error:', err);
            alert('Assignment failed: ' + err.message);
        }
    };

    if (loading) return <div className="loading">Loading teachers...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="assignment-container">
            <div className="header">
                <h2>Class Teacher Assignment</h2>
                <p>Assign teachers to classes and sections</p>
            </div>

            <div className="assignment-table">
                <table>
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Teacher</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scheduleRows.map((row, index) => (
                            <tr key={index} className="assignment-row">
                                <td className="serial-number">{index + 1}</td>
                                
                                <td>
                                    <select
                                        value={row.className}
                                        onChange={(e) => updateRow(index, 'className', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(cls => (
                                            <option key={cls} value={cls}>
                                                Class {cls}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                <td>
                                    <select
                                        value={row.sectionName}
                                        onChange={(e) => updateRow(index, 'sectionName', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map(section => (
                                            <option key={section} value={section}>
                                                {section === 'No' ? 'No Section' : `Section ${section}`}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                <td>
                                    <select
                                        value={row.teacherId}
                                        onChange={(e) => updateRow(index, 'teacherId', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.admin_id} value={teacher.admin_id}>
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                <td className="action-cell">
                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        disabled={scheduleRows.length === 1}
                                        className="btn-remove"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Rest of your component remains the same */}
            <div className="table-controls">
                <button type="button" onClick={addRow} className="btn btn-add">
                    + Add Row
                </button>
            </div>

            <div className="assignment-summary">
                <div className="summary-stats">
                    <span>Total Assignments: {scheduleRows.length}</span>
                    <span>Completed: {scheduleRows.filter(row => 
                        row.teacherId && row.className && row.sectionName
                    ).length}</span>
                    <span>Pending: {scheduleRows.filter(row => 
                        !row.teacherId || !row.className || !row.sectionName
                    ).length}</span>
                </div>
            </div>

            <div className="form-actions">
                <button
                    onClick={handlesubmit}
                    className="btn btn-submit"
                    disabled={!scheduleRows.every(row => 
                        row.teacherId && row.className && row.sectionName
                    )}
                >
                    Submit All Assignments
                </button>
            </div>

            {/* Existing assignments display */}
            {alreadyscheduled.length > 0 && (
                <div className="existing-assignments">
                    <div className="header">
                        <h2>Current Class Assignments</h2>
                        <p>Teachers already assigned to classes</p>
                    </div>

                    <div className="assignment-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Class</th>
                                    <th>Section</th>
                                    <th>Teacher</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alreadyscheduled.map((assignment, index) => (
                                    <tr key={index} className="assignment-row">
                                        <td className="serial-number">{index + 1}</td>
                                        <td>Class {assignment.className}</td>
                                        <td>{assignment.sectionName === 'No' ? 'No Section' : `Section ${assignment.sectionName}`}</td>
                                        <td>{assignment.teacherName}</td>
                                        <td>
                                            <span className="status-badge">Assigned</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="assignment-summary">
                        <div className="summary-stats">
                            <span>Total Assigned: {alreadyscheduled.length}</span>
                            <span>Teachers: {new Set(alreadyscheduled.map(a => a.teacherId)).size}</span>
                            <span>Classes: {new Set(alreadyscheduled.map(a => `${a.className}-${a.sectionName}`)).size}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignment;
