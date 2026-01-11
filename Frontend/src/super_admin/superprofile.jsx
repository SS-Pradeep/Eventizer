import { useEffect, useState } from "react";
import { auth } from "../config/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import "./css/superprofile.css";

const Superprofile = () => {
  const [superAdmin, setSuperAdmin] = useState(null);
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
          throw new Error("Failed to fetch super admin profile");
        }

        const data = await res.json();
        setSuperAdmin(data);
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

  if (!superAdmin) {
    return <p className="loading">Checking authentication...</p>;
  }
  return (
    <div className="super-profile-container">
      <div className="super-profile-details">
        <h2 className="super-name">{superAdmin.name}</h2>

        <ProfileItem label="Email" value={superAdmin.email} />
        <ProfileItem label="Class" value={superAdmin.class_name} />
        <ProfileItem label="Section" value={superAdmin.section} />
        <ProfileItem label="Role" value={superAdmin.role} />

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

export default Superprofile;
