import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useParams, useNavigate } from "react-router-dom";
import myImage from './assets/student.jpg';
import "./css/studentprofile.css";

const Studentprofile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); 
  useEffect(() => {
  const handleBackButton = () => {
    navigate("/", { replace: true }); // signup / login route
  };

  window.addEventListener("popstate", handleBackButton);

  return () => {
    window.removeEventListener("popstate", handleBackButton);
  };
}, [navigate]);
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else if (user.uid != uid) {
        alert("You are not authorized to view this page");
        navigate("/unauthorized");
      }
      setLoading(false); // done checking
    });

    return unsubscribe;
  }, [uid, navigate]);

  if (loading) {
    return <p>Loading...</p>; 
  }

  return (
    <>
    <div className="main">
      <div id="left">
        <button className="profile" onClick={() => navigate("/student/profile")}>
          <img src={myImage} alt="profile"/>
        </button>

        <button className="letter" onClick={() => navigate("/student/letter")}>
          Letter submission
        </button>

        <button
          className="Achievements"
          onClick={() => navigate("/student/achievements")}
        >
          Achievements
          </button>
        {/*
        <button
          className="Leaderboard"
          onClick={() => navigate("/student/leaderboard")}
        >
          Leaderboard
        </button>
        */}
      </div>

      <div id="right">
        <button
          id="createevent"
          onClick={() => navigate("/student/createevent")}
        >
          +
        </button>
        <br></br>
        <p>Creating an event press here</p>
      </div></div>
    </>
  );
};

export default Studentprofile;
