import { useEffect, useState } from "react";

const Assignment = ()=>{

    const [names,Setname] = useState([]);
    const [loading,setloading] = useState(true);
    const [error,Seterror] = useState([]);
    useEffect(()=>{
        const fetchdata = async()=>{
            try{
                setloading(false);
                const res = await fetch('http://localhost:3000/superadmin/getnames');
                if(!res.ok){
                    throw new Error(`HTTP ERROR Status: ${res.status}`);
                }

                Setname(res);
            }
            catch(err){
                Seterror(err);
            }
        }
        fetchdata();
    },[]);

    const classes = [1,2,3,4,5];
    const sections = ['A','B'];

    const handlesubmit = async (e) => {
        e.preventDefault();
        
        try{
            const response = await fetch("http://localhost:3000/eventregister", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
        }
        catch(err){

        }
    };
};
export default Assignment;