import { useEffect, useState } from "react";
import { auth } from "../config/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import "./css/profileadmin.css";

const Profileadmin = () => {
  const [admin, setAdmin] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthChecked(true);

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/api/admin/profile/${user.uid}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch admin profile");
        }

        const data = await res.json();
        setAdmin(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return <p className="loading">Loading...</p>;
  }

  if (loading) {
    return <p className="loading">Loading profile...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!admin) {
    return <p className="loading">Checking authentication...</p>;
  }

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-details">
        <h2 className="admin-name">{admin.name}</h2>

        <ProfileItem label="Email" value={admin.email} />
        <ProfileItem label="Class" value={admin.class_name} />
        <ProfileItem label="Section" value={admin.section} />
        <ProfileItem label="Role" value={admin.role} />
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

export default Profileadmin;
