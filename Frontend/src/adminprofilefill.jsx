
import { useNavigate } from "react-router-dom";
import { use,useState } from "react";
import {useLocation} from "react-router-dom";
const Adminprofilefill = ()=>{
    const location = useLocation();
    const uid = location.state?.uid;
    var filled = false;
    navigate = useNavigate();

      const [Name,Setname] = useState('');
      const [Email , SetEmail] = useState('');
      const [error,seterror] = useState(null);
      const [success,setsuccess] = useState(false);

      const handlesubmit = async (e)=>{
        e.preventDefault();
        filled = true;
        seterror(null);
        setsuccess(false);
        const data = {
            name: Name,
            uid,
            email: Email
        };
         
        try {
            const response = await fetch("http://localhost:3000/adminregister", { 
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
           
        } catch (err) {
            seterror(err.message);
            console.error(err);
        }
        navigate('/admin');
    };
        

    return(
        <>
        <div className="Adminfill">
            <form onSubmit={handlesubmit}>
            <div>
                <label>Name:</label>
        <input type='text' className='Name' value={Name} onChange={(e)=>Setname(e.target.value)} required/>

        <label>Email:</label>
        <input type='text' className='Rollnumber' value={Rollnumber} onChange={(e)=>SetEmail(e.target.value)} required/>
        
                <button className="continue">
                    <h2>continue</h2>
                </button>
            </div>
            </form>
        </div>
        </>
    )
}
export default Adminprofilefill;