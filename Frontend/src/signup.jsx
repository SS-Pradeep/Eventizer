import { signInWithPopup , GoogleAuthProvider ,createUserWithEmailAndPassword} from 'firebase/auth';
import './signup.css'
import auth from './config/firebase-config';
import {  useState } from 'react';
import { useNavigate } from 'react-router-dom';
import download from './assets/download.png';

const Signup = ()=>{
  

  const [email,setemail] = useState('');
  const [password , setpassword] = useState('');
  const [error,seterror] = useState(null);
  const [success,setsuccess] = useState(false);
  const navigate = useNavigate();

  const Changeforlogin = ()=>{
    navigate('/login');
  };


  const signupwithgoogle = async () => {
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
      if (isadmin) {
      navigate("/admin"); 
    } else if (isstudent) {
      navigate("/student/profilefill"); 
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userEmail = userCredential.user.email;
      console.log('User signed up:', userCredential.user);
      setsuccess(true);
      if(isadmin && userEmail == "hodamcs@tce.edu"){
        try{
          const response = await fetch('http://localhost:3000/superadmin/create', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name:"HODAMCS", uid: uid, email: userEmail ,role:"superadmin" })
          });
          if (!response.ok) {
            throw new Error('Failed to create superadmin record');
          }
          console.log('Superadmin record created successfully');
          if(response.ok){
             navigate(`/superadmin`);
          }
         
        }
        catch(err){
          console.error('Error creating superadmin record:', err);
        } 
        
      }
      else if(isadmin)
      {
        navigate('/admin');
      }
      
      else if(isstudent)
      {
        navigate(`/student/profilefill`);
      }
      
      
    } catch (err) {
      seterror(err.message);
      console.error('Signup error', err);
    }
  };

  
  return (
    <>
    <div className='signup'>
      <div className='Signupbase'> 
        <h1>Signup</h1>
        <form className='signupform' onSubmit={handlesubmit}>
       
        <label className='email'>Email:</label>
        <input type='email' className='Email' value={email} onChange={(e)=>setemail(e.target.value)} required/><br></br>

        <label className='password'>Password:</label>
        <input type='password' className='Password' value={password} onChange={(e)=>setpassword(e.target.value)} required/><br></br>

        <button type='submit' className='buttonforsignup'>submit</button>
        </form>
        {success && <p>Signup successful! You can now log in.</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
      <div className='Signupwithgoogle'>
        <button className='googlesignupbutton' onClick={signupwithgoogle}><img src={download} height='30' width='30'/>Signup with Google</button>
      </div>

     

      <div className='signupforadmin'>
        <button className='signupforadminbutton' onClick={Changeforlogin}>Login</button>
        
      </div>

      
    </div>
    </>
  );
};

export default Signup;
