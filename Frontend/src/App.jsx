
import { Route,Routes } from "react-router-dom";
import Signup from "./signup";
import Signupforadmin from "./signupforadmin";
import Profilefill from "./profilefill";
import Studentprofile from "./studentprofile";


const App = ()=> {
    return(
        <>
        <div>
            <Routes>
                <Route path="/" element={<Signup/>}/>
                <Route path="/profilefill" element={<Profilefill/>}/>
                <Route path="/login" element={<Signupforadmin/>}/>
                <Route path="/student" element={<Studentprofile/>}/>
            </Routes>
        </div>
        </>
    )
}

export default App;