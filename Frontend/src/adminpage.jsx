import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './adminpage.css';
import myImage from './assets/student.jpg';
const Adminpage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost:3000/admin/notifications")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch notifications");
                return res.json();
            })
            .then((data) => {
                console.log("Notifications:", data);
                setNotifications(data);
            })
            .catch((err) => {
                console.error(err);
                setError(err.message);
            });
    }, []);

    return (
        <>
        <div className="main">
            <div id="adminleft">
                <button className="profile" onClick={() => navigate("/profile")}>
          <img src={myImage} alt="profile"/>
        </button>
                <button className="btn" onClick={() => navigate('/search')}>Search</button>
                <button className="btn" onClick={() => navigate('/permission')}>Permission</button>
                <button className="btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
            </div>
            <div id="adminright">
                {error && <p style={{ color: "red" }}>{error}</p>}
                {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                        <div key={i} className="notification-item">
                            <h4>{n.title}</h4>
                            <p>{n.message}</p>
                            <small>{new Date(n.created_at).toLocaleString()}</small>
                        </div>
                    ))
                ) : (
                    <p>No notifications yet.</p>
                )}
            </div></div>
        </>
    );
};

export default Adminpage;
