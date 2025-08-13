import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useParams, useNavigate } from "react-router-dom";
import myImage from './assets/student.jpg';
import "./studentprofile.css";

const Studentprofile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else if (user.uid !== uid) {
        alert("You are not authorized to view this page");
        navigate("/unauthorized");
      }
      setLoading(false); // done checking
    });

    return unsubscribe;
  }, [uid, navigate]);

  if (loading) {
    return <p>Loading...</p>; // don’t render the page yet
  }

  return (
    <>
    <div className="main">
      <div id="left">
        <button className="profile" onClick={() => navigate("/profile")}>
          <img src={myImage} alt="profile"/>
        </button>

        <button className="letter" onClick={() => navigate("/letter")}>
          Letter submission
        </button>

        <button
          className="Achievements"
          onClick={() => navigate("/achievements")}
        >
          Achievements
        </button>
        <button
          className="Leaderboard"
          onClick={() => navigate("/leaderboard")}
        >
          Leaderboard
        </button>
      </div>

      <div id="right">
        <button
          id="createevent"
          onClick={() => navigate("/createanevent")}
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
