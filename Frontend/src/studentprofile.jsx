import {useNavigate} from "react-router-dom";


const Studentprofile = ()=>{

    const navigate = useNavigate();

    return(
        <>
        <div id="navbar">
            <button className="profile" onClick={()=>navigate('/profile')}>Profile</button>
            <button className="Achievements" onClick={()=>navigate('/achievements')}>Achievements</button>
            <button className="Leaderboard" onClick={()=>navigate('/leaderboard')}>Leaderboard</button>
        </div>

        <div id="main">
            <button id="createevent" onClick={()=>navigate('/createanevent')}>+</button>
            <p>Creating an event press here</p>
        </div>
        </>
    );
}
export default Studentprofile;