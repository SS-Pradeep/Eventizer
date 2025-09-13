const {Pool} = require('pg');  
const express = require('express');
const puppeteer = require('puppeteer');
const Minio = require('minio');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const app = express();
const upload = multer();
app.use(express.json());
app.use(cors({
  origin: '*'
}));

  
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'play.min.io',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true' || true,
    accessKey: process.env.MINIO_ACCESS_KEY || 'Q3AM3UQ867SPQQA43P2F',
    secretKey: process.env.MINIO_SECRET_KEY || 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
  });


const pool = new Pool({
    host : '127.0.0.1',
    user : 'postgres',
    port : 5432,
    password : 'Pradeep007', 
    database : 'Demodb'
});

pool.connect().then(()=>console.log("YEah.."));


app.post('/eventregister', async (req, res) => {
    const { name, event_type, description, st_date, end_date, permissionrequired, event_level, certificate_upload, organizer } = req.body;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Validate required fields
        if (!name || !event_type || !st_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, event_type, st_date, end_date'
            });
        }

        const insert_query = `
            INSERT INTO event (event_name, event_type, description, st_date, end_date, permission_required, event_level, certificate_upload, organiser) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING event_id
        `;
        
        const values = [name, event_type, description, st_date, end_date, permissionrequired, event_level, certificate_upload, organizer];

        const result = await client.query(insert_query, values);
        const event_id = parseInt(result.rows[0].event_id); // ✅ Fixed: Proper extraction and conversion

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: "Event registered successfully ✅",
            event_id: event_id,
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error registering event:', err);
        return res.status(500).json({
            success: false,
            error: "Event registration failed",
            message: err.message
        });
    } finally {
        client.release();
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
/*
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
});*/

//student-search ny name
app.get('/searchstudent', async (req, res) => {
  const { name,roll,year } = req.body;

  try {
    if(name!=""){
    const result = await Client.query(
      "SELECT * FROM student WHERE LOWER(name) = LOWER($1)",
      [name]
    );}
    if(roll!=""){
      const result = await Client.query(
      "SELECT * FROM student WHERE roll_number = $1",
      [roll]
    );
    }

    
    if (result.rows.length === 0) {
      return res.status(404).send("Search result not found");
    }

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Search failed");
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

/*
app.post('/upload-pdf', async (req, res) => {
  console.log("📥 /upload-pdf HIT");
  console.log("Body received:", req.body);

  const { st_date, end_date, reason, request_id } = req.body;

  if (!st_date || !end_date || !reason || !request_id) {
    return res.status(400).json({ success: false, msg: "Missing required fields" });
  }

  try {
    // 🟢 Replace this with Puppeteer/MinIO logic later
    const pdfUrl = `http://localhost:3000/generated_pdfs/${request_id}.pdf`;

    return res.status(200).json({
      success: true,
      msg: "✅ Upload success",
      data: { url: pdfUrl }   // 👈 IMPORTANT
    });
  } catch (err) {
    console.error("🔥 Error in /upload-pdf:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});*/
app.post('/upload-pdf', async (req, res) => {
  
  const client = await pool.connect();
  let browser;

  try {
    // Start database transaction
    await client.query('BEGIN');

    // Extract and validate input data
    const { uid, pdfData } = req.body;
    
    if (!uid || !pdfData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: uid or pdfData'
      });
    }

    const { event_id: rawEventId, st_date, end_date, reason } = pdfData;
    const bucketName = 'pdf-documents';
    
    // ✅ Fixed: Ensure event_id is properly converted to integer
    const event_id = parseInt(rawEventId);
    
    console.log('Raw event_id:', rawEventId);
    console.log('Parsed event_id:', event_id);
    console.log('event_id type:', typeof event_id);

    // Validate all required fields
    if (!st_date || !end_date || !reason || !uid || !event_id || isNaN(event_id)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required fields: uid, event_id, st_date, end_date, reason'
      });
    }

    // Additional validation
    if (new Date(st_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date'
      });
    }

    // Step 1: Get student_id
    let student_id_value;
    try {
      const student_idQuery = `SELECT student_id FROM student WHERE firebase_uid = $1`;
      const student_result = await client.query(student_idQuery, [uid]);
      
      if (student_result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "Student not found" 
        });
      }
      
      student_id_value = student_result.rows[0].student_id;
      console.log('Student ID found:', student_id_value);
    } catch(err) {
      console.error("Error fetching student:", err);
      throw new Error("Failed to fetch student data");
    }

    // Step 2: Verify event exists
    try {
      const eventCheckQuery = `SELECT event_id FROM event WHERE event_id = $1`;
      const eventResult = await client.query(eventCheckQuery, [event_id]);
      
      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Event not found"
        });
      }
      
      console.log('Event verified:', event_id);
    } catch(err) {
      console.error("Error verifying event:", err);
      throw new Error("Failed to verify event");
    }

    // Step 3: Insert request and get database-generated request_id
    let actual_request_id;
    try {
      const insertRequestQuery = `
        INSERT INTO request (student_id, event_id, permission_letter_status, admin_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING request_id
      `;
      
      const requestResult = await client.query(insertRequestQuery, 
        [student_id_value, event_id, "pending", null]);
        
      actual_request_id = requestResult.rows[0].request_id;
      console.log('Request ID created:', actual_request_id);
    } catch(err) {
      console.error("Error inserting request:", err);
      throw new Error("Failed to create request");
    }

    // Step 4: Generate PDF with enhanced error handling
    let pdfBuffer;
    try {
      browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                line-height: 1.8; 
                color: #333;
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px; 
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              .content { 
                text-align: justify; 
                font-size: 14px;
              }
              .signature {
                margin-top: 60px;
                text-align: right;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Leave Request Application</h2>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Request ID:</strong> ${actual_request_id}</p>
            </div>
            <div class="content">
              <p>Dear Sir/Madam,</p>
              <p>I am writing to formally request leave from <strong>${new Date(st_date).toLocaleDateString()}</strong> 
              to <strong>${new Date(end_date).toLocaleDateString()}</strong> due to <strong>${reason}</strong>.</p>
              <p>I will ensure that all my current tasks are completed or properly delegated before my leave period begins. 
              I am committed to ensuring a smooth transition of responsibilities during my absence.</p>
              <p>I would be grateful if you could approve this leave request at your earliest convenience.</p>
              <p>Thank you for your time and consideration.</p>
              
              <div class="signature">
                <p>Sincerely,</p>
                <br>
                <p>_________________________</p>
                <p>Student Signature</p>
                <p>Student ID: ${student_id_value}</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automatically generated document. Request ID: ${actual_request_id}</p>
            </div>
          </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { 
          top: '1in', 
          right: '1in', 
          bottom: '1in', 
          left: '1in' 
        },
        displayHeaderFooter: false
      });

      console.log("PDF generated successfully");
      
    } catch (pdfError) {
      console.error("PDF generation error:", pdfError);
      throw new Error(`PDF generation failed: ${pdfError.message}`);
    } finally {
      if (browser) {
        await browser.close();
        browser = null;
      }
    }

    // Step 5: Upload to MinIO with proper error handling
    let fileUrl, uploadResult;
    try {
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`Bucket '${bucketName}' created successfully`);
      }

      const fileKey = `leave-request-${actual_request_id}-${Date.now()}.pdf`;
      const buffer = Buffer.from(pdfBuffer);
      
      uploadResult = await minioClient.putObject(
        bucketName,
        fileKey,
        buffer,
        buffer.length,
        { 
          'Content-Type': 'application/pdf',
          'X-Amz-Meta-Request-Id': actual_request_id.toString(),
          'X-Amz-Meta-Upload-Date': new Date().toISOString()
        }
      );

      // Generate presigned URL (valid for 7 days)
      fileUrl = await minioClient.presignedGetObject(bucketName, fileKey, 7 * 24 * 60 * 60);
      
      console.log("File uploaded to MinIO successfully");

      // Step 6: Save to permission_letters table
      const insertQuery = `
        INSERT INTO permission_letters (request_id, file_key, url) 
        VALUES ($1, $2, $3) 
        RETURNING letter_id
      `;

      const dbResult = await client.query(insertQuery, [actual_request_id, fileKey, fileUrl]);
      const { letter_id } = dbResult.rows[0];
      
      console.log('Permission letter saved to database:', letter_id);

      // Commit the transaction
      await client.query('COMMIT');
      console.log("Transaction committed successfully");

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'PDF generated, uploaded to MinIO, and saved to database successfully',
        data: {
          letter_id: letter_id,
          request_id: actual_request_id,
          student_id: student_id_value,
          file_key: fileKey,
          url: fileUrl,
          bucket_name: bucketName,
          etag: uploadResult,
          leave_period: {
            start_date: st_date,
            end_date: end_date,
            reason: reason
          }
        }
      });

    } catch (minioError) {
      console.error("MinIO upload error:", minioError);
      throw new Error(`File upload failed: ${minioError.message}`);
    }

  } catch (error) {
    // Rollback transaction on any error
    try {
      await client.query('ROLLBACK');
      console.log("Transaction rolled back");
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }

    console.error('Complete error details:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process PDF upload request',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        timestamp: new Date().toISOString()
      } : undefined
    });

  } finally {
    // Clean up resources
    if (browser) {
      try {
        await browser.close();
      } catch (browserError) {
        console.error("Error closing browser:", browserError);
      }
    }
    
    if (client) {
      client.release();
    }
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

app.get("/students", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM student ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Search students by name / rollNumber / year

// API: Get student certificates grouped by event
app.get("/student/:id/certificates", async (req, res) => {
  const studentId = req.params.id;

  try {
    const query = `
      SELECT 
        s.student_id,
        s.name,
        s.roll_number,
        e.event_name,
        COUNT(c.certificate_id) AS certificate_count,
        ARRAY_AGG(c.certificate_id) AS certificates
      FROM student s
      LEFT JOIN certificates c ON s.student_id = c.student_id
      LEFT JOIN event e ON c.event_id = e.event_id
      WHERE s.student_id = $1
      GROUP BY s.student_id, s.name, s.roll_number, e.event_name
      ORDER BY e.event_name;
    `;

    const { rows } = await pool.query(query, [studentId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No certificates found for this student" });
    }

    res.json({
      student_id: rows[0].student_id,
      name: rows[0].name,
      roll_number: rows[0].roll_number,
      events: rows.map(r => ({
        event_name: r.event_name,
        certificate_count: r.certificate_count,
        certificates: r.certificates
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// ✅ Fetch single student by UID
app.get("/students/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await pool.query("SELECT * FROM student WHERE uid = $1", [uid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Database error" });
  }
});


app.post("/check-uid", async (req, res) => {
  try {
    const { uid, isstudent } = req.body;

    if (!uid) {
      return res.status(400).json({ exists: false, error: "UID required" });
    }

    // Determine which table to query
    const tableName = isstudent ? "student" : "admin";
    
    const result = await pool.query(
      `SELECT firebase_uid FROM ${tableName} WHERE firebase_uid = $1`,
      [uid]
    );

    return res.json({ exists: result.rows.length > 0 });
    
  } catch (err) {
    console.error("❌ Error checking UID:", err);
    res.status(500).json({ exists: false, error: "Database error" });
  }
});

app.get("/request",async (req,res)=>{
  try{
    const {status } = req.query;
    if (!status) {
      return res.status(400).json({ 
        error: 'Status query parameter is required',
        message: 'Please provide status as: pending, accepted, or rejected'
      });
    }

    // Validate status values
    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        message: 'Status must be one of: pending, accepted, rejected'
      });
    }

    const query = `
    SELECT 
    r.request_id,
    s.student_id,
       s.name,
       e.event_name,
       e.event_type,
       s.roll_number,
       r.permission_letter_status
FROM request r
INNER JOIN student s ON r.student_id = s.student_id
INNER JOIN event e ON e.event_id = r.event_id
WHERE r.permission_letter_status = $1; 

    `;

    const result = await pool.query(query, [status.toLowerCase()]);

    return res.status(200).json(result.rows);

  }
  catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch requests'
  })}
});

app.get("/admin/notifications" , async (req , res)=>{
  try{
    const query = `
    SELECT 
    s.name, s.roll_number , r.permission_letter_status
    from request r
    INNER JOIN student s ON r.student_id = s.student_id
    WHERE r.permission_letter_status = "pending";
    `;

    const result = await pool.query(query);
    return res.status(200).json(result.rows);

  }
  catch{
    console.error('Error fetching requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch requests'
  });
  }
});
// ✅ Add this endpoint if it's missing
app.put("/request/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        message: 'Status must be one of: pending, accepted, rejected'
      });
    }

    const query = `
      UPDATE request 
      SET permission_letter_status = $1 
      WHERE request_id = $2 
      RETURNING *
    `;

    const result = await pool.query(query, [status.toLowerCase(), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error updating request:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});


app.get("/requeststudent/:uid", async (req,res)=>{
   try{

    const {status } = req.query;
    const {uid} = req.params;
    if (!status) {
      return res.status(400).json({ 
        error: 'Status query parameter is required',
        message: 'Please provide status as: pending, accepted, or rejected'
      });
    }

    // Validate status values
    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        message: 'Status must be one of: pending, accepted, rejected'
      });
    }

    const query = `
    SELECT 
    e.event_id,
    e.event_name,
    e.end_date,
    e.organiser,
    r.permission_letter_status
FROM student s
INNER JOIN request r ON s.student_id = r.student_id
INNER JOIN event e ON r.event_id = e.event_id
WHERE s.firebase_uid = $1
  AND r.permission_letter_status = $2;

    `;

    const result = await pool.query(query, [uid,status.toLowerCase()]);

    return res.status(200).json(result.rows);
   }
   catch(err){
    console.log("Unable to fetch:" , err);
    return res.status(500).json("Unable to fetch");
   }
    
});

app.get("/certificateshow/:uid/:filter", async (req,res)=>{
  try{
    const {uid , filter} = req.params;
    query = `
    SELECT 
    
    e.event_id,
    e.event_name,
    e.event_type,
    e.end_date
FROM student s
INNER JOIN request r 
    ON s.student_id = r.student_id
INNER JOIN event e 
    ON r.event_id = e.event_id
WHERE s.firebase_uid = $1
  AND r.permission_letter_status = 'accepted'
  AND e.certificate_upload = $2;

    `;

    const result = await pool.query(query, [uid,filter]);
    console.log(result.rows);
    return res.status(200).json(result.rows);
  }
  catch(err){
    console.log("ERROR");
    return res.status(500).json({ error: "Database error" });
  }



  });

  app.post("/upload-certificate/:expandedId", upload.single("certificate"),async (req, res) => {
  const client = await pool.connect();
  try {
    const BUCKET = "certificate";
    const event_id = req.params.expandedId;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const pdfBuffer = req.file.buffer;

    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET, "us-east-1");
    }

    const objectName = `certificate-${Date.now()}.pdf`;

    await minioClient.putObject(BUCKET, objectName, pdfBuffer, pdfBuffer.length, {
      "Content-Type": "application/pdf",
    });

    const url = await minioClient.presignedGetObject(BUCKET, objectName, 24 * 60 * 60);

    await client.query("BEGIN");

    await client.query(
      `UPDATE event SET certificate_upload = true WHERE event_id = $1`,
      [event_id]
    );

    await client.query(
      `INSERT INTO certificates (request_id, file_key, url)
SELECT request_id, $2, $3
FROM request
WHERE event_id = $1;
`,
      [event_id, objectName, url]
    );

    await client.query("COMMIT");
    console.log("ALL ok");
    return res.json({
      message: "✅ Certificate uploaded & recorded",
      file_key: objectName,
      url,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Server error during upload" });
  } finally {
    client.release();
  }
});

app.get("/superadmin/notifications",async (req,res)=>{
  try{
  query = `
  SELECT s.name,c.class,e.event_type,e.organizer
  from request r
  inner join student s on r.student_id = s.student_id
  inner join event e on e.event_id = r.event_id
  inner join class c on c.class_id = r.class_id
  where r.current_stage = "superadmin"; 
  `;
  const result = await pool.query(query);
  return res.status(200).json(result.rows);
}
  catch{
    console.error('Error fetching requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch requests'
  });
  }
});

app.get("/superrequest",async (req,res)=>{
  try{
     
    const {status } = req.query;
    if (!status) {
      return res.status(400).json({ 
        error: 'Status query parameter is required',
        message: 'Please provide status as: pending, accepted, or rejected'
      });
    }

    // Validate status values
    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        message: 'Status must be one of: pending, accepted, rejected'
      });
    }

    const query = `
    SELECT 
       s.name,
       s.roll_number,
       e.event_name,
       e.event_type
       FROM request r
       INNER JOIN student s ON r.student_id = s.student_id
       INNER JOIN event e ON e.event_id = r.event_id
       WHERE r.permission_letter_status = $1 and r.curr_stage = "superadmin"
       ORDER BY e.evnt_name,s.name; 

    `;

    const result = await pool.query(query, [status.toLowerCase()]);

    return res.status(200).json(result.rows);

  }
  catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch requests'
  })}
});

app.put("/superrequests/update",async (req,res)=>{
  let { requestIds, status } = req.body;
  
  try {
    // Input validation
    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Convert single ID to array for uniform processing
    if (!Array.isArray(requestIds)) {
      requestIds = [requestIds];
    }
    
    if (requestIds.length === 0) {
      return res.status(400).json({ error: 'No request IDs provided' });
    }

    // Validate all IDs are numbers
    const numericIds = requestIds.map(id => {
      const numId = parseInt(id);
      if (isNaN(numId)) {
        throw new Error(`Invalid request ID: ${id}`);
      }
      return numId;
    });

    
    try {
      await pool.query('BEGIN');
      
      // Optimized bulk update using PostgreSQL ANY() operator
      const updateQuery = `
        UPDATE request 
        SET 
          permission_letter_status = $1,
          curr_stage = CASE 
            WHEN $1 IN ('accepted', 'rejected') THEN 'completed'
            ELSE curr_stage
          END,
          updated_at = NOW()
        WHERE request_id = ANY($2::int[]) 
          AND curr_stage = 'superadmin'
          AND permission_letter_status = 'pending'
        RETURNING request_id, permission_letter_status, curr_stage, updated_at
      `;
      
      const result = await pool.query(updateQuery, [status, numericIds]);
      await pool.query('COMMIT');
      
      const updated = result.rows;
      const updatedIds = updated.map(row => row.request_id);
      const failedIds = numericIds.filter(id => !updatedIds.includes(id));
      
      console.log(`Bulk update completed: ${updated.length}/${numericIds.length} records updated to ${status}`);
      
      return res.json({
        success: true,
        updated: updatedIds,
        failed: failedIds,
        total_requested: numericIds.length,
        total_updated: updated.length,
        message: `${updated.length} request(s) ${status} successfully`,
        details: updated,
        operation_type: numericIds.length === 1 ? 'single' : 'bulk',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(500).json({ 
      error: 'Update failed', 
      details: error.message,
      failed_ids: requestIds || []
    });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update operation failed:', error);
    return res.status(500).json({ 
      error: 'Update failed', 
      details: error.message,
      failed_ids: requestIds || []
    });
  }
});

const PORT = 3000;
app.listen(PORT,()=>{
    console.log("Listening" + PORT);
});


