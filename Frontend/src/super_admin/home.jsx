
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './adminpage.css';
import myImage from './assets/student.jpg';
const Home = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("http://localhost:3000/superadmin/notifications"); 
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data = await response.json();
        console.log(data);
        setNotifications(data);   
      } catch (err) {
        setError(err.message);
      }
    };

    fetchNotifications();
  }, []); 

    return (
        <>
        <div className="main">
            <div id="adminleft">
                <button className="profile" onClick={() => navigate("/profile")}>
          <img src={myImage} alt="profile"/>
        </button>
        {/* <button className="btn" onClick={() => navigate('/search')}>Search</button> -->*/}
                <button className="btn" onClick={() => navigate('/assignment')}>Tutor Assignment</button>
                <button className="btn" onClick={() => navigate('/letterapproval')}>Permission Letters</button>
            </div>
            <div id="adminright">
                {error && <p style={{ color: "red" }}>{error}</p>}
                {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                        <div key={i} className="notification-item">
                            <h4>{n.student_name}</h4> <p>{n.current_year}</p>
                            
                        </div>
                    ))
                ) : (
                    <p>No notifications yet.</p>
                )}
            </div></div>
        </>
    );
};

export default Home;

