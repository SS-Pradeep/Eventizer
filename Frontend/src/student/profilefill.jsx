import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import myImage from './assets/arrow.png';
import './css/profilefill.css';

const Profilefill = () => {
    const navigate = useNavigate();
      
    const [uid, setUid] = useState('');
    const [name, setName] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [graduationYear, setGraduationYear] = useState('');
    const [studentClass, setStudentClass] = useState(''); 
    const [section, setSection] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Simple options
    const classOptions = ['I', 'II', 'III', 'IV', 'V'];
    const sectionOptions = ['No','A', 'B'];

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Auth state:', user); // Debug
            if (user) {
                setUid(user.uid); 
                setEmail(user.email);
            } else {
                navigate("/login");
            }
        });
        return unsubscribe;
    }, [navigate]);

    const handleSubmit = async (e) => {
        console.log('🔥 FORM SUBMITTED!'); // This should appear in console
        e.preventDefault();
        e.stopPropagation();
        
        setError('');
        setLoading(true);
        
        const data = {
            firebase_uid: uid,
            name: name,
            roll_number: rollNumber,
            graduation_year: parseInt(graduationYear),
            student_class: studentClass,
            section: section,
            email: email
        };
        
        console.log('Submitting data:', data);
        
        try {
            const response = await fetch("http://localhost:3000/api/studentregister", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed");
            }

            navigate(`/student/${uid}`);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Debug click handler
    const handleButtonClick = (e) => {
        console.log('🔥 BUTTON CLICKED!', e.type); // This should appear
    };

    return (
        <div className="profilefill">
            <div className="left-half"></div>
            <div className="right-half">
                <div className="form-container">
                    <form onSubmit={handleSubmit}>
                        <h2>Complete Profile</h2>
                        
                        {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

                        <div className="form-group">
                            <label htmlFor="name">Name:</label>
                            <input 
                                id="name"
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input 
                                id="email"
                                type="email" 
                                value={email}
                                disabled
                                style={{backgroundColor: '#f5f5f5'}}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="rollNumber">Roll Number:</label>
                            <input 
                                id="rollNumber"
                                type="text" 
                                value={rollNumber} 
                                onChange={(e) => setRollNumber(e.target.value)} 
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="studentClass">Class:</label>
                            <select 
                                id="studentClass"
                                value={studentClass} 
                                onChange={(e) => setStudentClass(e.target.value)} 
                                required
                            >
                                <option value="">Select</option>
                                {classOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="section">Section:</label>
                            <select 
                                id="section"
                                value={section} 
                                onChange={(e) => setSection(e.target.value)} 
                                required
                            >
                                <option value="">Select</option>
                                {sectionOptions.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="graduationYear">Graduation Year:</label>
                            <input 
                                id="graduationYear"
                                type="number" 
                                value={graduationYear} 
                                onChange={(e) => setGraduationYear(e.target.value)} 
                                min="2020"
                                max="2030"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            onClick={handleButtonClick}
                            disabled={loading || !uid}
                            style={{
                                opacity: loading || !uid ? 0.6 : 1,
                                cursor: loading || !uid ? 'not-allowed' : 'pointer',
                                background: '#004080',
                                border: 'none',
                                borderRadius: '50%',
                                width: '60px',
                                height: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '20px auto 0',
                                pointerEvents: loading || !uid ? 'none' : 'auto'
                            }}
                        >
                            {loading ? (
                                <span style={{color: 'white', fontSize: '12px'}}>Loading...</span>
                            ) : (
                                <img 
                                    src={myImage} 
                                    alt="continue" 
                                    height="30px" 
                                    width="30px"
                                    style={{pointerEvents: 'none'}}
                                />
                            )}
                        </button>
                        
                        
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Profilefill;
