const {Pool} = require('pg');  
const express = require('express');

const app = express();
app.use(express.json());

const pool = new Pool({
    host : process.env.host,
    user : process.env.user,
    port : process.env.port,
    password : process.env.password, 
    database : process.env.database
});

pool.connect().then(()=>console.log("YEah.."));


//after entering event details
app.post('/eventregister', async (req,res)=>{
    const {name,event_type,description,st_date,end_date,permission_required,event_level,certificate_upload,organizer} = req.body;

    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO event (name,event_type,description,st_date,end_date,permission_required,event_level,certificate_upload,organizer) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)";
        const values = [name,event_type,description,st_date,end_date,permission_required,event_level,certificate_upload,organizer];

        const result = await Client.query(insert_query, values);
    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
    
});

//after student signin
app.post('/studentregister', async (req,res)=>{

    const {name,firebase_url,roll_number,graduation_year} = req.body;
    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO student (name,firebase_url,roll_number,graduation_year) values($1,$2,$3,$4)";
        const values = [name,firebase_url,roll_number,graduation_year];
        const result = await Client.query(insert_query, values);

    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
    
});

//after admin signin
app.post('/adminregister', async (req,res)=>{

    const {name,firebase_url,email} = req.body;
    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO student (name,firebase_url,email) values($1,$2,$3)";
        const values = [name,firebase_url,email];
        const result = await Client.query(insert_query, values);
        
    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
    
});

//after click the permisson letter sending button
app.post('/requestregister', async (req,res)=>{

    const {name,studentid,eventid,permission_letter_status,admin_id} = req.body;
    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO request (name,studentid,eventid,permission_letter_status,admin_id) values($1,$2,$3,$4,$5)";
        const values = [name,studentid,eventid,permission_letter_status,admin_id];
        const result = await Client.query(insert_query, values);
    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
});

//after permission letter generated
app.post('/letterregister', async (req,res)=>{

    const {requestid,file_key,url} = req.body;
    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO letters (name,studentid,eventid,permission_letter_status,admin_id) values($1,$2,$3,$4,$5)";
        const values = [requestid,file_key,url];
        const result = await Client.query(insert_query, values);
    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
});

//after certificate approval
app.post('/certificateregister', async (req,res)=>{

    const {requestid,studentid,file_key,url} = req.body;
    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO certificates (requestid,studentid,file_key,url) values($1,$2,$3,$4)";
        const values = [requestid,studentid,file_key,url];
        const result = await Client.query(insert_query, values);
    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
});

//after certificate approval
app.post('/leaderboardregister', async (req,res)=>{

    const {student_id,total_score,academic_score,non_academic_score} = req.body;
    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO leaderboard (student_id,total_score,academic_score,non_academic_score) values($1,$2,$3,$4)";
        const values = [student_id,total_score,academic_score,non_academic_score];
        const result = await Client.query(insert_query, values);
    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
});

//while sreaching for student -- admin
app.get('/searchstudent/:id',(req,res)=>{
    const {id} = req.params;

    try{
        const result = await.Client.query(
            "SELECT * FROM STUDENT WHERE roll_number = $1",[id]
        )

        if (result.rows.length === 0) {
            return res.status(404).send("Search result not found");
        }
        
        res.json(result.rows[0]);
    }
    catch(err){
        console.error(err);
        res.status(500).send("Insert failed");
    }
});

//student-search ny name
app.get('/searchstudent/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const result = await Client.query(
      "SELECT * FROM student WHERE LOWER(name) = LOWER($1)",
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Search result not found");
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Search failed");
  }
});


//updateding the letter permission as approved/rejected/pending
app.put('/update-status/:id', async (req, res) => {
  const requestId = req.params.id;
  const { status } = req.body;

  const allowedStatus = ['approved', 'rejected'];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const query = `UPDATE Request SET permission_letter_status = $1 WHERE request_id = $2 RETURNING *`;
    const result = await pool.query(query, [status, requestId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request ID not found' });
    }

    res.status(200).json({
      message: 'Status updated successfully',
      updated: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//search by year
app.get('/search-by-year/:year',async (req,res)=>{
    const year = parseInt(req.params.year);
    try {
    const result = await pool.query(`
      SELECT * FROM events
      WHERE EXTRACT(YEAR FROM st_date) = $1
    `, [year]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching events by year', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//admin-notification
app.get('/admin/notifications', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.request_id,
        s.name AS student_name,
        s.graduation_year,
        CASE 
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) = s.graduation_year THEN '5th Year'
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) = s.graduation_year - 1 THEN '4th Year'
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) = s.graduation_year - 2 THEN '3rd Year'
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) = s.graduation_year - 3 THEN '2nd Year'
          WHEN EXTRACT(YEAR FROM CURRENT_DATE) = s.graduation_year - 4 THEN '1st Year'
          ELSE 'Graduated or Invalid'
        END AS current_year
      FROM 
        request r
      JOIN 
        student s ON r.student_id = s.student_id
      WHERE 
        r.permission_letter_status = 'pending'
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

//pie-chart for dashboard
app.get('/dashboard/event-participation', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.name AS event_name,
        COUNT(r.student_id) AS student_count
      FROM 
        participation_requests r
      JOIN 
        events e ON r.event_id = e.event_id
      GROUP BY 
        e.name;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching event data:', err);
    res.status(500).send('Failed to fetch data');
  }
});

//dash-board-participation
app.get('/participation-percent/:year', async (req, res) => {
  const { year } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        e.event_level,
        COUNT(*) * 100.0 / (
          SELECT COUNT(*) 
          FROM participation_requests pr
          JOIN students s ON pr.student_id = s.student_id
          JOIN events e2 ON pr.event_id = e2.event_id
          WHERE s.graduation_year = $1
            AND EXTRACT(YEAR FROM e2.st_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        ) AS percentage
      FROM participation_requests pr
      JOIN students s ON pr.student_id = s.student_id
      JOIN events e ON pr.event_id = e.event_id
      WHERE s.graduation_year = $1
        AND EXTRACT(YEAR FROM e.st_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY e.event_level;
    `, [year]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching participation data");
  }
});



app.listen(process.env.PORT,()=>{
    console.log("Listening" + {PORT});
});