import { use, useState } from "react";
import { useNavigate } from "react-router-dom";


const Createevent = ()=>{
    const [event_name , SetName] = useState('');
    const [eventype , SetType] = useState('');
    const [description , SetDes] = useState('');
    const [st_date , SetstDate] = useState('');
    const [end_date, SetendDate] = useState('');
    const [permissionrequired , SetPermission] = useState(false);
    const [Certificateupload , SetCertificate] = useState(false);
    const [Organizer,SetOrganizer] = useState('');
    const [event_level , SetLevel] = useState('');
    const navigate = useNavigate();

    const handlesubmit = async (e)=>{
        e.preventDefault();
          const data = {
            name : event_name,
            event_type : eventype,
            description : description,
            st_date : st_date,
            end_date : end_date,
            permissionrequired : permissionrequired,
            event_level : event_level,
            certificate_upload : Certificateupload,
            organizer : Organizer
          };

          try{
           const response = await fetch("http://localhost:3000/eventregister", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)

                
            }
          );

          if (!response.ok) {
                throw new Error("Failed to Register for an event ");
            }

          
            setsuccess(true);
            navigate('/letterconformation');
          }
        catch(err){
          console.log(err);
        }
    };

    return(
        <>
        <div id="#mainevent">
            <div id="form" onSubmit={handlesubmit}>
                <label>
        Event Name:
        <input
          type="text"
          value={event_name}
          onChange={(e) => SetName(e.target.value)}
          required
        />
      </label>
      <br />

      {/* Event Type */}
      <label>
        Event Type:
        <input
          type="text"
          value={eventype}
          onChange={(e) => SetType(e.target.value)}
          required
        />
      </label>
      <br />

      {/* Description */}
      <label>
        Description:
        <textarea
          value={description}
          onChange={(e) => SetDes(e.target.value)}
        />
      </label>
      <br />

      {/* Start Date */}
      <label>
        Start Date:
        <input
          type="date"
          value={st_date}
          onChange={(e) => SetstDate(e.target.value)}
        />
      </label>
      <br />

      {/* End Date */}
      <label>
        End Date:
        <input
          type="date"
          value={end_date}
          onChange={(e) => SetendDate(e.target.value)}
        />
      </label>
      <br />

      {/* Permission Required */}
      <label>
        Permission Required:
        <input
          type="checkbox"
          checked={permissionrequired}
          onChange={(e) => SetPermission(e.target.checked)}
        />
      </label>
      <br />

      {/* Certificate Upload */}
      <label>
        Certificate Upload Required:
        <input
          type="checkbox"
          checked={Certificateupload}
          onChange={(e) => SetCertificate(e.target.checked)}
        />
      </label>
      <br />

      {/* Organizer */}
      <label>
        Organizer:
        <input
          type="text"
          value={Organizer}
          onChange={(e) => SetOrganizer(e.target.value)}
        />
      </label>
      <br />

      {/* Event Level */}
      <label>
        Event Level:
        <select
          value={event_level}
          onChange={(e) => SetLevel(e.target.value)}
        >
          <option value="">Select Level</option>
          <option value="local">Local</option>
          <option value="national">National</option>
          <option value="international">International</option>
        </select>
      </label>
      <br />

      <button type="submit">Submit</button>
            </div>
        </div>
        </>
    )
};

export default Createevent;