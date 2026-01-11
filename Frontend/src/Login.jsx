import { signInWithPopup , GoogleAuthProvider ,createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import auth from './config/firebase-config';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { use, useState } from 'react';
import download from './assets/download.png'

function Login() {

    const navigate = useNavigate();
    const [error,seterror]  = useState(null);
    const [success,setsuccess] = useState(false);
    const [email,setemail] = useState('');
    const [password,setpassword] = useState('');
    const [Code , setCode] = useState('');
    
   const checkUser = async (uid, isadmin, isstudent,email) => {
  try {
    const res = await fetch("http://localhost:3000/api/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, isstudent })
    });

    const data = await res.json();
    const exists = data.exists; 
    console.log("Check user response:", data);
    console.log("Email:", email);
    console.log("UID:", uid);
    console.log("Is Admin:", isadmin);
    console.log("Is Student:", isstudent);
    if(exists && email == "hodamcs@tce.edu"){
      navigate(`/superadmin`);
    }
    else if (exists && isadmin) {
      navigate(`/admin/adminprofile/${uid}`); 
    } else if (exists && isstudent) {
      navigate(`/student/${uid}`);
    } else { 
      if (isadmin) {
        navigate("/admin");
      } else if (isstudent) {
        navigate(`/student/profilefill`);
      } else {
        seterror("Invalid user type detected.");
      }
    }
  } catch (err) {
    console.error("Error checking user:", err);
    console.log(err);
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

    await checkUser(uid, isadmin, isstudent,userEmail);

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
      const userEmail = userCredential.user.email;

    console.log("User signed in:", userCredential.user);
    setsuccess(true);

    await checkUser(uid, isadmin, isstudent,userEmail);

  } catch (err) {
    console.error("Sign-in error:", err);
    seterror(err.message);
  }
};

 
  const Signup = ()=>{
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
        <input type='password' autoComplete="current-password" className='Passwordadmin' value={password} onChange={(e)=>setpassword(e.target.value)} required/>

  

        <button type='submit' className='buttonforsignupadmin'>submit</button>
        </form>
        {success && <p>Signup successful! You can now log in.</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
      <div className='Signupwithgoogleadmin'>
        <button className='googlesignupbuttonadmin'onClick={loginwithgoogle} ><img src={download} height='30' width='30'/>Login with Google</button>
      </div>

      <div className='backs'>
        <button className='back' onClick={Signup}>Signup</button>
      </div>
    </div>
    </>
  )

}

export default Login;