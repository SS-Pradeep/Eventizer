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


    const loginwithgoogle = async () => {
    seterror(null);
    const provider = new GoogleAuthProvider();
    try {

      const userCred = await signInWithPopup(auth, provider);
      const userEmail = userCred.user.email;
      const uid = userCred.user.uid;
      

      const isadmin = userEmail.endsWith("@tce.edu");
      const isstudent = userEmail.endsWith("@student.tce.edu");

      if(!isadmin && !isstudent){
      seterror("Only student with student id and admin with admin id can register");
      return;
    }

      console.log('Google user signed in:', userCred.user);
      setsuccess(true);
      try{
      const checkUser = async () => {
    const res = await fetch('http://localhost:3000//check-uid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });

    const exists = await res.json(); // true or false

    if (exists && isadmin) {
      navigate(`/admin/adminprofile/:uid`); // User exists → go here
    } else if(exists && isstudent){
      navigate(`/profilefill/student/:uid`);  // User not found → go here
    }
  };}
  catch (err){
    console.log("PP");
  }
      if (isadmin) {
      navigate("/admin"); 
    } if (isstudent ) {
      navigate("/student"); 
    }

    } catch (err) {
      seterror(err.message);
      console.error('Google sign-in error:', err);
    }
  };

  const handlesubmit = async (e)=>{
    e.preventDefault();
    seterror(null);
    setsuccess(false);

    const isadmin = email.endsWith("@tce.edu");
    const isstudent = email.endsWith("@student.tce.edu");

    if(!isadmin && !isstudent){
      seterror("Only student with student id and admin with admin id can register");
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log('User signed up:', userCredential.user);
      setsuccess(true);
       try{
      const checkUser = async () => {
    const res = await fetch('http://localhost:3000//check-uid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });

    const exists = await res.json(); // true or false

    if (exists && isadmin) {
      navigate(`/admin/adminprofile/:uid`); // User exists → go here
    } else if(exists && isstudent){
      navigate(`/profilefill/student/:uid`);  // User not found → go here
    }
  };}
  catch (err){
    console.log("PP");
  }
      if(isadmin){
        navigate('/admin',{ state: { uid } });
      }
      else{
        navigate('/profilefill',{ state: { uid } });
      }
      
    } catch (err) {
      seterror(err.message);
      console.error('Signin error', err);
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