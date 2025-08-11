import { signInWithPopup , GoogleAuthProvider ,createUserWithEmailAndPassword} from 'firebase/auth';
import './signup.css'
import auth from './config/firebase-config';
import {  useState } from 'react';
import { useNavigate } from 'react-router-dom';
import download from './assets/download.png';

function Signup() {
  

  const [email,setemail] = useState('');
  const [password , setpassword] = useState('');
  const [error,seterror] = useState(null);
  const [success,setsuccess] = useState(false);
  const navigate = useNavigate();

  const Changeforadmin = ()=>{
    navigate('/login');
  };


  const loginwithgoogle = async () => {
    seterror(null);
    const provider = new GoogleAuthProvider();
    try {
      const userCred = await signInWithPopup(auth, provider);
      const userEmail = userCred.user.email;
      const uid = userCredential.user.uid;

      const isadmin = userEmail.endsWith("@tce.edu");
      const isstudent = userEmail.endsWith("@student.tce.edu");

      if(!isadmin && !isstudent){
      seterror("Only student with student id and admin with admin id can register");
      return;
    }

      console.log('Google user signed in:', userCred.user);
      setsuccess(true);
      if (isadmin) {
      navigate("/admin",{state:{uid}}); 
    } else if (isstudent) {
      navigate("/profilefill",{state:{uid}}); 
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
      console.log('User signed up:', userCredential.user);
      setsuccess(true);
      if(isadmin)
      {
        navigate('/admin',{state:{uid}});
      }
      else if(isstudent)
      {
        navigate('/profilefill',{state:{uid}});
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
        <button className='googlesignupbutton' onClick={loginwithgoogle}><img src={download} height='30' width='30'/>Signup with Google</button>
      </div>

     

      <div className='signupforadmin'>
        <button className='signupforadminbutton' onClick={Changeforadmin}>Login</button>
        
      </div>

      
    </div>
    </>
  );
};

export default Signup;
