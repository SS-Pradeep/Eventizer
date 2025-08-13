import { useNavigate } from "react-router-dom";
import { use,useState } from "react";
import {useLocation} from "react-router-dom";
import myImage from './assets/arrow.png';
import './profilefill.css';
const Profilefill = ()=>{
    const location = useLocation();
    const uid = location.state?.uid;
    var filled = false;
    const navigate = useNavigate();

      const [Name,Setname] = useState('');
      const [Rollnumber , SetRollNumber] = useState(0);
      const [year,setyear] = useState('');
      const [error,seterror] = useState(null);
      const [success,setsuccess] = useState(false);
      const [profileupdated,setprofile] = useState(false);
      const handlesubmit = async (e)=>{
        e.preventDefault();
        filled = true;
        seterror(null);
        setsuccess(false);
        setprofile(true);
        const data = {
            uid,
            name: Name,
            rollNumber: Rollnumber,
            graduationYear: year,
            profileupdated : true
        };
         
        try {
            console.log(uid, Rollnumber, year);
            const response = await fetch("http://localhost:3000/studentregister", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error("Failed to save profile");
            }

            setsuccess(true);
            navigate('/student');
        } catch (err) {
            seterror(err.message);
            console.error(err);
        }
        
        
    };
        

    return(
        <>
        <div className="profilefill">
            <div className="left-half"></div>
            <div className="right-half">
            <form className="form-container"  onSubmit={handlesubmit}>
            <div>
                <label>Name:</label><br></br>
        <input type='text' className='Name' value={Name} onChange={(e)=>Setname(e.target.value)} required/><br></br>

        <label>Roll Number:</label><br></br>
        <input type='number' className='Rollnumber' value={Rollnumber} onChange={(e)=>SetRollNumber(e.target.value)} required/><br></br>

        <label>Graduation Year:</label><br></br>
        <input type='number' className='Graduationyear' value={year} onChange={(e)=>setyear(e.target.value)} required/><br></br>

                <button className="continue">
                    <img src={myImage} alt="continue" height="30px" width="30px"/>
                </button>
            </div>
            </form>
        </div></div>
        </>
    )
}
export default Profilefill;