
import { Route,Routes } from "react-router-dom";
import Signup from "./signup";
import Login from "./Login";
import Profilefill from "./student/profilefill";
import Studentprofile from "./student/studentprofile";
import Adminprofilefill from "./admin/adminprofilefill";
import Adminpage from "./admin/adminpage";
import Createevent from "./student/createevent";
import StudentSearch from "./admin/search";
import AdminLetterApproval from "./admin/letterapproval";
import Studentletters from "./student/studentletters";
import Achievements from "./student/studentAchievement";
import SuperAdminLetterApproval from "./super_admin/letterapproval";
import Home from "./super_admin/home";
import Assignment from "./super_admin/assignment";
{/*
import Assignment from "./super_admin/assignment";
import AdminLetterApproval from "./admin/letterapproval";*/}

const App = ()=> {
    return(
        <>
        <div>
            <Routes>
                <Route path="/" element={<Signup/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/student/profilefill" element={<Profilefill/>}/>
                <Route path="/student/:uid" element={<Studentprofile/>}/>
                <Route path="/student/createevent" element={<Createevent/>}/>
                <Route path="/student/letter" element={<Studentletters/>}/>
                <Route path="/student/achievements" element={<Achievements/>}/>
                <Route path="/admin/search" element={<StudentSearch/>}/>
                <Route path="/admin/permission" element={<AdminLetterApproval/>}/>
                <Route path="/admin" element={<Adminprofilefill/>}/>
                <Route path="/admin/adminprofile/:uid" element={<Adminpage/>}/>
                <Route path="/superadmin" element = {<Home/>}/>
                
                <Route path="/superadmin/letterapproval" element = {<SuperAdminLetterApproval/>}/>
                <Route path="/superadmin/assignment" element = {<Assignment/>}/>
            </Routes>
        </div>
        </>
    )
}

export default App;