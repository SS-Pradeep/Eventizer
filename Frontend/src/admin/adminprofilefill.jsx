
import { useNavigate } from "react-router-dom";
import myImage from './assets/arrow.png';
import './css/adminprofilefill.css';
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Adminprofilefill = ()=>{


    const navigate = useNavigate();
      const [uid,Setuid] = useState('');
      const [Name,Setname] = useState('');
      const [Email , SetEmail] = useState('');
      const [error,seterror] = useState(null);
      const [success,setsuccess] = useState(false);
      const [loading, setLoading] = useState(true);
      
    useEffect(() => {
              const auth = getAuth();
              const unsubscribe = onAuthStateChanged(auth, (user) => {
                  if (user) {
                      Setuid(user.uid); 
                      SetEmail(user.email);
                    } 
                  else {
                      navigate("/login");}
                      setLoading(false);
                      
              });
        return unsubscribe;
      }, [navigate]);

      if (loading) {
    return <p>Loading...</p>;
}
      
      const handlesubmit = async (e)=>{
        e.preventDefault();
        
        seterror(null);
        setsuccess(false);
        const data = {
            firebase_uid: uid,
            name: Name,
            email : Email
        };
         
        try {
            const response = await fetch("http://localhost:3000/api/adminregister", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error("Failed to save profile");
            }

            console.log("Navigating to:", `/admin/adminprofile/${uid}`);
            navigate(`/admin/adminprofile/${uid}`);

            setsuccess(true);
            
           
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
            <form className="form-container" onSubmit={handlesubmit}>
            <div>
                <label>Name:</label>
        <input type='text' className='Name' value={Name} onChange={(e)=>Setname(e.target.value)} required/>

        <label>Email:</label>
        <input type='text' className='Rollnumber' value={Email} onChange={(e)=>SetEmail(e.target.value)} required/>
        
                <button type="submit" className="continue">
                    <img src={myImage} alt="continue" height="30px" width="30px"/>
                    
                </button>
            </div>
            </form>
            </div>
        </div>
        </>
    )
}
export default Adminprofilefill;