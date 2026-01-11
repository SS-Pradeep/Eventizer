import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";

import {auth}  from "./config/firebase-config";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import download from "./assets/download.png";


function Auth() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [error, seterror] = useState(null);
  const [success, setsuccess] = useState(null);
  


  // ================= CHECK USER (UNCHANGED) =================
  const checkUser = async (uid, isadmin, isstudent, email) => {
    try {
      const res = await fetch("http://localhost:3000/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, isstudent })
      });

      const data = await res.json();
      const exists = data.exists;

      if (exists && email === "hodamcs@tce.edu") {
        navigate(`/superadmin`);
      } else if (exists && isadmin) {
        navigate(`/admin/adminprofile/${uid}`);
      } else if (exists && isstudent) {
        navigate(`/student/${uid}`);
      } else {
        if (isadmin) navigate("/admin");
        else if (isstudent) navigate("/student/profilefill");
        else seterror("Invalid user type detected.");
      }
    } catch (err) {
      seterror("Something went wrong while checking your profile.");
    }
  };

  // ================= EMAIL AUTH (LOGIN → SIGNUP FALLBACK) =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    seterror(null);
    setsuccess(false);

    const isadmin = email.endsWith("@tce.edu");
    const isstudent = email.endsWith("@student.tce.edu");

    if (!isadmin && !isstudent) {
      seterror("Only TCE students and admins are allowed.");
      return;
    }

    try {
      // 1️⃣ Try Login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      await checkUser(uid, isadmin, isstudent, email);
      setsuccess(true);
    } catch (err) {
      // 2️⃣ If user not found → Signup
      if (err.code === "auth/user-not-found") {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          const uid = userCred.user.uid;
          await checkUser(uid, isadmin, isstudent, email);
          setsuccess(true);
        } catch (signupErr) {
          seterror(signupErr.message);
        }
      } else {
        seterror(getAuthErrorMessage(err.code));
      }
    }
  };

  // ================= GOOGLE AUTH =================
  const loginWithGoogle = async () => {
    seterror(null);
    const provider = new GoogleAuthProvider();

    try {
      const userCred = await signInWithPopup(auth, provider);
      const email = userCred.user.email;
      const uid = userCred.user.uid;

      const isadmin = email.endsWith("@tce.edu");
      const isstudent = email.endsWith("@student.tce.edu");

      if (!isadmin && !isstudent) {
        seterror("Only TCE students and admins are allowed.");
        return;
      }

      await checkUser(uid, isadmin, isstudent, email);
      setsuccess(true);
    } catch (err) {
      seterror(err.message);
    }
  };


  const getAuthErrorMessage = (code) => {
    console.log("Auth error code:", code);
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password";

    case "auth/user-not-found":
      return "No account found with this email";

    case "auth/email-already-in-use":
      return "This email is already registered";

    case "auth/too-many-requests":
      return "Too many attempts. Try again later";

    default:
      return "Something went wrong. Please try again";
  }
};


  // ================= FORGOT PASSWORD =================
  const forgotPassword = async () => {
  if (!email) {
    seterror("Enter your email to reset password");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    seterror(null);
    setsuccess("Password reset link sent");
  } catch (err) {
    setsuccess(null);
    seterror("Unable to send reset link");
  }
};


  return (
  <div className="signupadmin">
    <div className="Signupbaseadmin">
      <form className="signupformadmin" onSubmit={handleSubmit}>
        <h1>Sign Up / Login</h1>

        <label>Email</label>
        <input
          type="email"
          className="Emailadmin"
          value={email}
          onChange={(e) => setemail(e.target.value)}
          required
        />

        <label>Password</label>

        <div className="password-wrapper">
        <input
            type={showPassword ? "text" : "password"}
            className="Passwordadmin"
            value={password}
            onChange={(e) => setpassword(e.target.value)}
            required
        />

        <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
        >
            {showPassword ? "Hide" : "Show"}
        </span>
        </div>

        <button type="submit" className="buttonforsignupadmin">
          Continue
        </button>

        <span className="forgot-password" onClick={forgotPassword}>
          Forgot password?
        </span>
      </form>

      {success && (
  <div className="auth-message success">{success}</div>
)}
{error && <div className="auth-error-text">{error}</div>}



      <div className="Signupwithgoogleadmin">
        <button
          className="googlesignupbuttonadmin"
          onClick={loginWithGoogle}
          type="button"
        >
          <img src={download} alt="google" />
          Continue with Google
        </button>
      </div>
    </div>
  </div>
);

}

export default Auth;
