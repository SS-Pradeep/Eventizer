import { useNavigate } from "react-router-dom";
import { use,useState } from "react";

const Profilefill = ()=>{

    var filled = false;
      navigate = useNavigate();

      const [Name,Setname] = useState('');
      const [Rollnumber , SetRollNumber] = useState('');
      const [year,setyear] = useState('');
      const [error,seterror] = useState(null);
      const [success,setsuccess] = useState(false);

      const handlesubmit = async (e)=>{
        filled = true;
        navigate('/student');
      }

    return(
        <>
        <div className="profilefill">
            <form onSubmit={handlesubmit}>
            <div>
                <label>Name:</label>
        <input type='text' className='Name' value={Name} onChange={(e)=>Setname(e.target.value)} required/>

        <label>Roll Number:</label>
        <input type='text' className='Rollnumber' value={Rollnumber} onChange={(e)=>SetRollNumber(e.target.value)} required/>

        <label>Graduation Year:</label>
        <input type='number' className='Graduationyear' value={year} onChange={(e)=>setyear(e.target.value)} required/>

                <button className="continue">
                    <h2>continue</h2>
                </button>
            </div>
            </form>
        </div>
        </>
    )
}

export default Profilefill;