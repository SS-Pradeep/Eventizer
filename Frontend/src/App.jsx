
import { Route,Routes } from "react-router-dom";
import Signup from "./signup";
import Signupforadmin from "./signupforadmin";
import Profilefill from "./profilefill";
import Studentprofile from "./studentprofile";
import Adminprofilefill from "./adminprofilefill";
import Adminpage from "./adminpage";
import Createevent from "./createevent";
import StudentSearch from "./search";
import AdminLetterApproval from "./letterapproval";


const App = ()=> {
    return(
        <>
        <div>
            <Routes>
                <Route path="/" element={<Signup/>}/>
                <Route path="/profilefill" element={<Profilefill/>}/>
                <Route path="/login" element={<Signupforadmin/>}/>
                <Route path="/student/:uid" element={<Studentprofile/>}/>
                <Route path="/admin" element={<Adminprofilefill/>}/>
                <Route path="/admin/adminprofile/:uid" element={<Adminpage/>}/>
                <Route path="/createevent" element={<Createevent/>}/>
                <Route path="/search" element={<StudentSearch/>}/>
                <Route path="/permission" element={<AdminLetterApproval/>}/>
            </Routes>
        </div>
        </>
    )
}

export default App;