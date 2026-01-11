import { useEffect, useState } from "react";
import { auth } from "../config/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import "./css/profile.css";



const Profile = () => {
  const [student, setStudent] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);

      // Wait for Firebase auth — do not error immediately
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/api/student/profile/${currentUser.uid}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setStudent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* 🔄 Waiting for Firebase to restore auth */
  if (!authChecked) {
    return <p className="loading">Loading...</p>;
  }

  /* 👤 Auth checked, still waiting */
  if (!user) {
    return <p className="loading">Checking authentication...</p>;
  }

  /* 📡 Profile loading */
  if (loading) {
    return <p className="loading">Loading profile...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="profile-container">
      {/* LEFT: Student details */}
      <div className="profile-details">
        <h2 className="student-name">{student.student_name}</h2>

        <ProfileItem label="Email" value={student.student_email} />
        <ProfileItem label="Roll Number" value={student.roll_number} />
        <ProfileItem label="Class Name" value={student.class_name} />
        <ProfileItem label="Section" value={student.section} />
        <ProfileItem label="Class Teacher" value={student.teacher_name} />
        <ProfileItem label="Teacher Email" value={student.teacher_email} />
      </div>

      
    </div>
  );
};

const ProfileItem = ({ label, value }) => (
  <div className="detail">
    <span>{label}</span>
    <p>{value || "-"}</p>
  </div>
);

export default Profile;
