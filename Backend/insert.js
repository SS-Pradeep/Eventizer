const {Pool} = require('pg');  
const express = require('express');
const puppeteer = require('puppeteer');
const Minio = require('minio');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*'
}));

const pool = new Pool({
    host : '127.0.0.1',
    user : 'postgres',
    port : 5432,
    password : 'Pradeep007', 
    database : 'Demodb'
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

    const {firebase_uid,name,roll_number,graduation_year,profileupdated} = req.body;


    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO student (name,firebase_uid,roll_number,graduation_year,profileupdated) values($1,$2,$3,$4,$5)";
        const values = [name,firebase_uid,roll_number,graduation_year,profileupdated];
        const result = await Client.query(insert_query, values);
        res.status(200).send({ message: "Insert successful" });
    } 
    catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
    
});

//after admin signin
app.post('/adminregister', async (req,res)=>{

    const {name,firebase_uid,email} = req.body;
    try {
        const Client = await pool.connect();
        const insert_query = "INSERT INTO admin (name,firebase_uid,email) values($1,$2,$3)";
        const values = [name,firebase_uid,email];
        const result = await Client.query(insert_query, values);
        res.status(200).send({ message: "Insert successful" }); 
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

app.post('/check-uid', async (req, res) => {
  const { uid } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM ADMIN WHERE uid = $1)',
      [uid]
    );

    res.json(result.rows[0].exists);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json(false); 
  }
});
app.post('/upload_pdf', async (req, res) => {
  const Minio = require('minio');
  const puppeteer = require('puppeteer');

  // Initialize MinIO client
  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
  });

  const client = await pool.connect();

  try {
    // Start database transaction
    await client.query('BEGIN');

    // Extract data from request body
    const { st_date, end_date, reason, request_id } = req.body;
    const bucketName = 'pdf-documents';

    // Validation
    if (!st_date || !end_date || !reason || !request_id) {
      return res.status(400).json({
        error: 'Missing required fields: st_date, end_date, reason, request_id'
      });
    }

    // Step 1: Generate PDF buffer using Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(`
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              line-height: 1.8; 
            }
            .header { text-align: center; margin-bottom: 30px; }
            .content { text-align: justify; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Leave Request Application</h2>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="content">
            <p>Dear Sir/Madam,</p>
            <p>I am writing to formally request leave from <strong>${st_date}</strong> to <strong>${end_date}</strong> due to <strong>${reason}</strong>.</p>
            <p>I will ensure that all my current tasks are either completed or delegated before my leave begins.</p>
            <p>Thank you for your consideration.</p>
          </div>
        </body>
      </html>
    `);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' }
    });

    await browser.close();

    // Step 2: Check if bucket exists, create if not
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }

    // Step 3: Generate unique filename (this becomes file_key)
    const fileKey = `leave-request-${request_id}-${Date.now()}.pdf`;

    // Step 4: Upload PDF buffer to MinIO
    const uploadResult = await minioClient.putObject(
      bucketName,
      fileKey,
      pdfBuffer,
      pdfBuffer.length,
      {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileKey}"`
      }
    );

    // Step 5: Generate file URL
    const fileUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${bucketName}/${fileKey}`;

    // Step 6: Insert file_key and url into database
    const insertQuery = `
      INSERT INTO Permission_letters (request_id, file_key, url) 
      VALUES ($1, $2, $3) 
      RETURNING letter_id
    `;

    const dbResult = await client.query(insertQuery, [request_id, fileKey, fileUrl]);
    const letterId = dbResult.rows[0].letter_id;

    // Commit transaction
    await client.query('COMMIT');

    console.log('PDF uploaded and database updated successfully');
    
    // Step 7: Return success response
    res.status(200).json({
      success: true,
      message: 'PDF generated, uploaded, and saved to database successfully',
      data: {
        letter_id: letterId,
        request_id: request_id,
        file_key: fileKey,
        url: fileUrl,
        bucket_name: bucketName,
        etag: uploadResult,
        upload_date: new Date().toISOString()
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error generating PDF or saving to database:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF and save to database',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Release database connection
    client.release();
  }
});

app.get("/letters/:request_id", async (req, res) => {
  const { request_id } = req.params;
  try {
    const query = `
      SELECT url 
      FROM Permission_letters 
      WHERE request_id = $1
    `;
    const result = await pool.query(query, [request_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Letter not found" });
    }

    return res.json({ url: result.rows[0].url });
  } catch (err) {
    console.error("Error fetching letter:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * 2. Accept / Reject Letter → Update Permission_letter_status
 */
app.post("/letters/:request_id/status", async (req, res) => {
  const { request_id } = req.params;
  const { status } = req.body; // should be "accepted" or "rejected"

  try {
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const query = `
      UPDATE Request 
      SET Permission_letter_status = $1 
      WHERE request_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, request_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    return res.json({
      message: `Letter ${status}`,
      updated: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating status:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * 3. List Pending Letters → Fetch requests with status = pending
 */
app.get("/letters/pending", async (req, res) => {
  try {
    const query = `
      SELECT r.request_id, s.name AS student_name, e.event_name, p.url 
      FROM Request r
      JOIN Student s ON r.Student_id = s.Student_id
      JOIN Event e ON r.event_id = e.event_id
      LEFT JOIN Permission_letters p ON r.request_id = p.request_id
      WHERE r.Permission_letter_status = 'pending'
    `;
    const result = await pool.query(query);

    return res.json(result.rows);
  } catch (err) {
    console.error("Error fetching pending letters:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


const PORT = 3000;
app.listen(PORT,()=>{
    console.log("Listening" + PORT);
});


