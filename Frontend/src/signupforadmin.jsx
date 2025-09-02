import { signInWithPopup , GoogleAuthProvider ,createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import auth from './config/firebase-config';
import './signupforadmin.css';
import { useNavigate } from 'react-router-dom';
import { use, useState } from 'react';
import download from './assets/download.png'

function Signupforadmin() {

    const navigate = useNavigate();
    const [error,seterror]  = useState(null);
    const [success,setsuccess] = useState(false);
    const [email,setemail] = useState('');
    const [password,setpassword] = useState('');
    const [Code , setCode] = useState('');



   const checkUser = async (uid, isadmin, isstudent) => {
  try {
    const res = await fetch("http://localhost:3000/check-uid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, isstudent }), // Only send what backend needs
    });

    const data = await res.json();
    const exists = data.exists; // Handle object response

    if (exists && isadmin) {
      navigate(`/admin/adminprofile/${uid}`); 
    } else if (exists && isstudent) {
      navigate(`/student/${uid}`);
    } else { 
      if (isadmin) {
        navigate("/admin", { state: { uid } });
      } else if (isstudent) {
        navigate(`/profilefill`, { state: { uid } });
      } else {
        seterror("Invalid user type detected.");
      }
    }
  } catch (err) {
    console.error("Error checking user:", err);
    seterror("Something went wrong while checking your profile. Try again.");
  }
};


const loginwithgoogle = async () => {
  seterror(null);
  const provider = new GoogleAuthProvider();

  try {
    const userCred = await signInWithPopup(auth, provider);
    const userEmail = userCred.user.email;
    const uid = userCred.user.uid;

    const isadmin = userEmail.endsWith("@tce.edu");
    const isstudent = userEmail.endsWith("@student.tce.edu");

    if (!isadmin && !isstudent) {
      seterror("Only students and admins with TCE emails can register.");
      return;
    }

    console.log("✅ Google user signed in:", userCred.user);
    setsuccess(true);

    await checkUser(uid, isadmin, isstudent);

  } catch (err) {
    console.error("Google sign-in error:", err);
    seterror(err.message);
  }
};


  const handlesubmit = async (e) => {
  e.preventDefault();
  seterror(null);
  setsuccess(false);

  const isadmin = email.endsWith("@tce.edu");
  const isstudent = email.endsWith("@student.tce.edu");

  if (!isadmin && !isstudent) {
    seterror("Only students and admins with TCE emails can register.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    console.log("✅ User signed in:", userCredential.user);
    setsuccess(true);

    // 🔥 Call backend to check if profile is filled
    await  checkUser(uid, isadmin, isstudent);

  } catch (err) {
    console.error("❌ Sign-in error:", err);
    seterror(err.message);
  }
};

 
  const Gottoback = ()=>{
    navigate('/');
  };


  return(
    <>
    <div className='signupadmin'>
      <div className='Signupbaseadmin'> 
        <form className='signupformadmin' onSubmit={handlesubmit}>
        <h1>Login</h1>
        <label>Email:</label>
        <input type='email' className='Emailadmin' value={email} onChange={(e)=>setemail(e.target.value)} required/>

        <label>Password:</label>
        <input type='password' className='Passwordadmin' value={password} onChange={(e)=>setpassword(e.target.value)} required/>

  

        <button type='submit' className='buttonforsignupadmin'>submit</button>
        </form>
        {success && <p>Signup successful! You can now log in.</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
      <div className='Signupwithgoogleadmin'>
        <button className='googlesignupbuttonadmin'onClick={loginwithgoogle} ><img src={download} height='30' width='30'/>Signup with Google</button>
      </div>

      <div className='backs'>
        <button className='back' onClick={Gottoback}>Signup</button>
      </div>
    </div>
    </>
  )

}

export default Signupforadmin;