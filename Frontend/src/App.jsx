import { Routes, Route } from "react-router-dom";
import Auth from "./auth.jsx";

import Profilefill from "./student/profilefill";
import Studentprofile from "./student/studentprofile";
import Createevent from "./student/createevent";
import Studentletters from "./student/studentletters";
import Achievements from "./student/studentAchievement";
import Profile from "./student/Profile.jsx";

import Adminprofilefill from "./admin/adminprofilefill";
import Adminpage from "./admin/adminpage";
import StudentSearch from "./admin/search";
import AdminLetterApproval from "./admin/letterapproval";
import Profileadmin from "./admin/profileadmin";

import Home from "./super_admin/home";
import SuperAdminLetterApproval from "./super_admin/letterapproval";
import Assignment from "./super_admin/assignment";
import Superprofile from "./super_admin/superprofile";


const App = () => {
  return (
    <Routes>
      {/* 🔐 AUTH ENTRY POINT */}
      <Route path="/" element={<Auth />} />

      {/* 🎓 STUDENT */}
      <Route path="/student/profilefill" element={<Profilefill />} />
      <Route path="/student/:uid" element={<Studentprofile />} />
      <Route path="/student/createevent" element={<Createevent />} />
      <Route path="/student/letter" element={<Studentletters />} />
      <Route path="/student/achievements" element={<Achievements />} />
      <Route path="/student/profile" element={<Profile />} />

      {/* 🧑‍💼 ADMIN */}
      <Route path="/admin" element={<Adminprofilefill />} />
      <Route path="/admin/adminprofile/:uid" element={<Adminpage />} />
      <Route path="/admin/search" element={<StudentSearch />} />
      <Route path="/admin/permission" element={<AdminLetterApproval />} />
      <Route path="/admin/profile" element={<Profileadmin />} />


      {/* 👑 SUPER ADMIN */}
      <Route path="/superadmin" element={<Home />} />
      <Route path="/superadmin/profile" element={<Superprofile />} />
      <Route path="/superadmin/letterapproval" element={<SuperAdminLetterApproval />} />
      <Route path="/superadmin/assignment" element={<Assignment />} />
    </Routes>
  );
};

export default App;
