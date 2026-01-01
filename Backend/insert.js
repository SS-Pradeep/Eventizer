const {Pool} = require('pg');  
const express = require('express');
const puppeteer = require('puppeteer');
const Minio = require('minio');
const cors = require('cors');
require("dotenv").config();
const multer = require('multer');
require('dotenv').config();
const app = express();
const upload = multer();
app.use(express.json());
app.use(cors({
  origin: '*'
}));

  
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});


const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect().then(()=>console.log("YEah.."));

app.post('/api/eventregister', async (req, res) => {
const {
  event_name,
  event_type,
  description,
  start_date,
  end_date,
  permissionrequired,
  event_level,
  Certificateupload = false, // Default to false if not provided
  organizer
} = req.body;
    let client;
    const status = permissionrequired ? 'upcoming' : 'completed';

    try {
        client = await pool.connect();
        

        const insert_query = `
            INSERT INTO event (event_name, event_type, description, start_date, end_date, permission_required, certificate_upload, event_level, organizer, status, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
            RETURNING event_id
        `;
        
        const values = [
            event_name, 
            event_type, 
            description, 
            start_date, 
            end_date, 
            permissionrequired, //is permission needed for the event or not
            Certificateupload ,     // Default to false if not provided
            event_level, 
            organizer,
            status
        ];

        const result = await client.query(insert_query, values);
        const event_id = result.rows[0].event_id;

        res.status(200).json({
            success: true,
            message: "Event registered successfully",
            event_id: event_id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Insert failed" });
    } finally {
        if (client) {
            client.release();
        }
    }
});


//after student signin
app.post('/api/studentregister', async (req,res)=>{

    const { 
        firebase_uid, 
        name, 
        roll_number, 
        graduation_year, 
        student_class, 
        section, 
        email 
    } = req.body;

    // Validate required fields
    if (!firebase_uid || !name || !roll_number || !graduation_year || !student_class || !section || !email) {
        return res.status(400).json({
            error: "Validation failed",
            message: "All fields are required"
        });
    }
    try{
       client = await pool.connect();
        
        await client.query('BEGIN');
        
        const find_class_query = `
            SELECT class_id FROM class 
            WHERE class_name = $1  AND section = $2
        `;

      const find_class_query_1 = await client.query(find_class_query, [student_class, section]);
        const insert_student_query = `
            INSERT INTO student (firebase_uid, name, roll_number, email, class_id, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING student_id, name, roll_number, email, class_id
        `;
        const class_result = await client.query(find_class_query, [student_class, section]);
        if (class_result.rows.length === 0) {
          throw new Error("Class not found");
        }      
        const class_id = class_result.rows[0].class_id;
        const student_values = [firebase_uid, name, roll_number, email, class_id];
        const student_result = await client.query(insert_student_query, student_values);
        
        // Commit the transaction
        await client.query('COMMIT');
        return res.status(201).json({ 
            success: true,
            message: "Student registration successful"
        });

    }
    catch(err){
      return res.json({
        message : "Error in inserting"
      });
    };
});

//after admin signin
app.post('/api/adminregister', async (req, res) => {
    const { name, firebase_uid, email } = req.body;

    let client;
    
    try {
        client = await pool.connect();
        
        const insert_admin_query = `
            INSERT INTO admin (firebase_uid, name, email, role, created_at, updated_at) 
            VALUES ($1, $2, $3, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        const admin_values = [firebase_uid, name, email];
        await client.query(insert_admin_query, admin_values);
        
        return res.status(200).json({ message: "Insert successful" });
        
    } catch (err) {
        console.error(err);
        return  res.status(500).json({ message: "Insert failed" });
    } finally {
        if (client) {
            client.release();
        }
    }
});


//after click the permisson letter sending button
app.post('/api/requests', async (req, res) => {
    const { student_id, event_id, admin_id } = req.body;

    let client;
    
    try {
        client = await pool.connect();
        
        // Validate required fields
        if (!student_id || !event_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: student_id, event_id'
            });
        }

        const insert_query = `
            INSERT INTO request (student_id, event_id, status, current_stage, submitted_at, created_at, updated_at) 
            VALUES ($1, $2, 'pending', 'tutor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
            RETURNING request_id, student_id, event_id, status, current_stage, submitted_at
        `;
        
        const values = [student_id, event_id];
        const result = await client.query(insert_query, values);
        
        const new_request = result.rows[0];

        return res.status(200).json({
            success: true,
            message: "Request submitted successfully",
            data: {
                request_id: new_request.request_id,
                student_id: new_request.student_id,
                event_id: new_request.event_id,
                status: new_request.status,
                current_stage: new_request.current_stage,
                submitted_at: new_request.submitted_at
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Insert failed" });
    } finally {
        if (client) {
            client.release();
        }
    }
});


//after permission letter generated
app.post('/api/letters', async (req, res) => {
    const { req_id, filename, minio_object_key } = req.body;

    let client;
    
    try {
        client = await pool.connect();
        
        // Validate required fields
        if (!req_id || !filename || !minio_object_key) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: req_id, filename, minio_object_key'
            });
        }

        const insert_query = `
            INSERT INTO permission_letter (req_id, filename, minio_object_key, created_at, updated_at) 
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
            RETURNING perm_id, req_id, filename, minio_object_key, created_at
        `;
        
        const values = [req_id, filename, minio_object_key];
        const result = await client.query(insert_query, values);
        
        const new_letter = result.rows[0];

        return res.status(200).json({
            success: true,
            message: "Permission letter uploaded successfully",
            data: {
                perm_id: new_letter.perm_id,
                req_id: new_letter.req_id,
                filename: new_letter.filename,
                minio_object_key: new_letter.minio_object_key,
                created_at: new_letter.created_at
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Insert failed" });
    } finally {
        if (client) {
            client.release();
        }
    }
});


//after certificate approval
app.post('/api/certificates/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { req_id, filename, minio_object_key } = req.body;
    
    let client;
    
    try {
        // Validate required fields
        if (!req_id || !filename || !minio_object_key) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: req_id, filename, minio_object_key'
            });
        }

        client = await pool.connect();
        
        const insert_query = `
            INSERT INTO certificate (req_id, filename, minio_object_key, created_at) 
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING certificate_id, req_id, filename, minio_object_key, created_at
        `;
        
        const values = [req_id, filename, minio_object_key];
        const result = await client.query(insert_query, values);
        
        res.status(201).json({
            success: true,
            message: "Certificate registered successfully",
            data: result.rows[0]
        });
        
    } catch (err) {
        console.error('Certificate registration error:', err);
        res.status(500).json({
            success: false,
            error: "Failed to register certificate"
        });
    } finally {
        if (client) {
            client.release();
        }
    }
});



//while sreaching for student -- admin
app.get('/api/students/:id/events', async(req, res) => {
    const {id} = req.params;
    
    try {
        const query = `
          SELECT 
            e.event_name, 
            e.event_type,
            COUNT(*) as event_count,
            MAX(r.status) as latest_status
          FROM request r
          JOIN event e ON r.event_id = e.event_id  
          WHERE r.student_id = $1
          GROUP BY e.event_name, e.event_type
          ORDER BY event_count DESC
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "No events found for this student" 
            });
        }
        
        return res.json({
            success: true,
            student_id: id,
            events: result.rows,
            total_events: result.rows.length
        });
        
    } catch(err) {
        console.error('Search student events error:', err);
        return res.status(500).json({ error: "Failed to search student events" });
    }
});



//student-search ny name
app.get('/api/students/search', async (req, res) => {
    try {
        const { name, roll,  class: className, section } = req.query;

        // Build dynamic SQL query
        let query = `
            SELECT 
                s.student_id as id,
                s.name,
                s.roll_number as roll,
                c.class_name,
                c.section
            FROM student s
            INNER JOIN class c ON s.class_id = c.class_id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        // Add conditions based on provided parameters
        if (name) {
            paramCount++;
            query += ` AND s.name ILIKE $${paramCount}`;
            params.push(`%${name}%`);
        }

        if (roll) {
            paramCount++;
            query += ` AND s.roll_number = $${paramCount}`;
            params.push(roll);
        }

        if (className) {
            paramCount++;
            query += ` AND c.class_name = $${paramCount}`;
            params.push(className);
        }

        if (section) {
            paramCount++;
            query += ` AND c.section = $${paramCount}`;
            params.push(section);
        }

        query += ` ORDER BY s.name ASC`;

        console.log('Search query:', query);
        console.log('Parameters:', params);

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            students: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('Error searching students:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search students',
            error: error.message
        });
    }
});



app.put('/api/requests/:id/status', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status, uid } = req.body; 
    // Validate request ID
    if (!requestId) {
      return res.status(400).json({ 
        success: false,
        error: 'Request ID is required' 
      });
    }

    // Validate UID
    if (!uid) {
      return res.status(400).json({ 
        success: false,
        error: 'Admin UID is required' 
      });
    }

    // Get admin name from database using UID
    const adminQuery = await pool.query('SELECT name FROM admin WHERE firebase_uid = $1', [uid]);
    
    if (adminQuery.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin not found' 
      });
    }
    
    const adminName = adminQuery.rows[0].name;

    // Simple validation
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Status must be approved or rejected' 
      });
    }

    let query;
    let params;

    if (status === 'approved') {
      // If approved: keep status as 'pending' and change current_stage to 'super_admin'
      query = `
        UPDATE request 
        SET current_stage = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE request_id = $3 
        RETURNING request_id, status, current_stage, approved_by, updated_at
      `;
      params = ['super_admin', adminName, requestId];
    } else if (status === 'rejected') {
      // If rejected: change status to 'rejected' and current_stage to 'completed'
      query = `
        UPDATE request 
        SET status = $1, current_stage = $2, rejected_by = $3, updated_at = CURRENT_TIMESTAMP 
        WHERE request_id = $4 
        RETURNING request_id, status, current_stage, rejected_by, updated_at
      `;
      params = ['rejected', 'completed', adminName, requestId];
    }

    console.log('Update Query:', query);
    console.log('Parameters:', params);

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Request not found' 
      });
    }

    return res.status(200).json({
      success: true,
      message: `Request ${status} successfully by ${adminName}`,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to update status',
      details: err.message
    });
  }
});



//search by year
app.get('/search-by-year/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const { event_type, limit = 20 } = req.query;

    // Simple validation
    if (isNaN(year) || year < 2000 || year > 2030) {
      return res.status(400).json({ 
        error: 'Invalid year. Must be between 2000-2030' 
      });
    }

    // Build simple query
    let query = `
      SELECT 
        event_id,
        event_name,
        event_type,
        start_date,
        end_date,
        organizer,
        certificate_upload
      FROM event 
      WHERE EXTRACT(YEAR FROM start_date) = $1
    `;
    
    const params = [year];

    // Optional event type filter
    if (event_type) {
      query += ` AND event_type ILIKE $2`;
      params.push(`%${event_type}%`);
    }

    query += ` ORDER BY start_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      year: year,
      events: result.rows,
      count: result.rows.length
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

//admin-notification
app.get('/admin/notifications', async (req, res) => {
  try {
    const { uid, limit = 10, offset = 0 } = req.query;
    
    // Validate required parameter
    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'Firebase UID is required'
      });
    }

    const query = `
      SELECT 
        r.request_id,
        r.submitted_at,
        s.name AS student_name,
        s.roll_number,
        c.class_name,
        c.section,
        e.event_name,
        e.event_type,
        e.event_level,
        e.organizer,
        e.start_date,
        e.end_date
      FROM request r
      INNER JOIN student s ON r.student_id = s.student_id
      INNER JOIN class c ON s.class_id = c.class_id
      INNER JOIN event e ON r.event_id = e.event_id
      INNER JOIN admin a ON c.class_teacher_id = a.admin_id
      WHERE r.current_stage = 'tutor' 
        AND r.status = 'pending'
        AND a.firebase_uid = $1
      ORDER BY r.submitted_at ASC
      LIMIT $2 OFFSET $3
    `;

    // Fixed parameter order: uid, limit, offset
    const result = await pool.query(query, [uid, parseInt(limit), parseInt(offset)]);

    // Count query with same filtering for accurate pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM request r
      INNER JOIN student s ON r.student_id = s.student_id
      INNER JOIN class c ON s.class_id = c.class_id
      INNER JOIN admin a ON c.class_teacher_id = a.admin_id
      WHERE r.current_stage = 'tutor' 
        AND r.status = 'pending'
        AND a.firebase_uid = $1
    `;

    const countResult = await pool.query(countQuery, [uid]);
    const totalCount = parseInt(countResult.rows[0].total);

    return res.status(200).json({
      success: true,
      data: {
        notifications: result.rows,
        total: totalCount,
      }
    });

  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch notifications',
      message: 'Database error occurred'
    });
  }
});

//pie-chart for dashboard

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
//uploading the pdf to minio bucket storage
// PDF generation and upload endpoint

app.post("/auto-request", async (req, res) => {
  let client;

  try {
    const { uid, event_id } = req.body;

    if (!uid || !event_id) {
      return res.status(400).json({
        success: false,
        error: "Missing uid or event_id",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    // STEP 1: Get student ID
    const studentQuery = `SELECT student_id FROM student WHERE firebase_uid = $1`;
    const studentRes = await client.query(studentQuery, [uid]);

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    const student_id = studentRes.rows[0].student_id;

    // STEP 2: Check event exists and permission_required = false
    const eventCheck = `
      SELECT event_id, permission_required 
      FROM event 
      WHERE event_id = $1
    `;
    const eventRes = await client.query(eventCheck, [event_id]);

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    if (eventRes.rows[0].permission_required === true) {
      return res.status(400).json({
        success: false,
        error: "This event requires permission; use /upload-pdf instead.",
      });
    }

    // STEP 3: Auto-create request (NO PERMISSION LETTER NEEDED)
    const insertRequest = `
      INSERT INTO request (student_id, event_id, status, current_stage, submitted_at, created_at, updated_at)
      VALUES ($1, $2, 'approved', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING request_id
    `;

    const requestRes = await client.query(insertRequest, [student_id, event_id]);

    const request_id = requestRes.rows[0].request_id;

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Auto request created successfully (permission not required)",
      request_id: request_id,
      event_id: event_id,
      student_id: student_id,
    });

  } catch (err) {
    console.error("AUTO REQUEST ERROR:", err);

    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {}
    }

    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) client.release();
  }
});


app.post('/upload-pdf', async (req, res) => {
  let client;
  let browser;

  try {
    client = await pool.connect();
    
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
    const bucketName = 'permissionletters';
    
    // Ensure event_id is properly converted to integer
    const event_id = parseInt(rawEventId);
    
    console.log('Raw event_id:', rawEventId);
    console.log('Parsed event_id:', event_id);

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

    // Step 1: Get student_id and student name
    let student_id_value, student_name;
    try {
      const student_idQuery = `SELECT student_id, name FROM student WHERE firebase_uid = $1`;
      const student_result = await client.query(student_idQuery, [uid]);
      
      if (student_result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "Student not found" 
        });
      }
      
      student_id_value = student_result.rows[0].student_id;
      student_name = student_result.rows[0].name;
      console.log('Student ID found:', student_id_value);
      console.log('Student Name:', student_name);
    } catch(err) {
      console.error("Error fetching student:", err);
      throw new Error("Failed to fetch student data");
    }

    // Step 2: Verify event exists and get event details
    let event_details;
    try {
      const eventCheckQuery = `SELECT event_id, event_name, organizer FROM event WHERE event_id = $1`;
      const eventResult = await client.query(eventCheckQuery, [event_id]);
      
      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Event not found"
        });
      }
      
      event_details = eventResult.rows[0];
      console.log('Event verified:', event_details);
    } catch(err) {
      console.error("Error verifying event:", err);
      throw new Error("Failed to verify event");
    }

    // Step 3: Insert request and get database-generated request_id
    let actual_request_id;
    try {
      const insertRequestQuery = `
        INSERT INTO request (student_id, event_id, status, current_stage, submitted_at, created_at, updated_at) 
        VALUES ($1, $2, 'pending', 'tutor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING request_id
      `;
      
      const requestResult = await client.query(insertRequestQuery, [student_id_value, event_id]);
        
      actual_request_id = requestResult.rows[0].request_id;
      console.log('Request ID created:', actual_request_id);
    } catch(err) {
      console.error("Error inserting request:", err);
      throw new Error("Failed to create request");
    }

    // Step 4: Generate PDF with better content
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
              .details-table {
                margin: 20px 0;
                width: 100%;
                border-collapse: collapse;
              }
              .details-table td {
                padding: 8px;
                border: 1px solid #ddd;
              }
              .details-table .label {
                font-weight: bold;
                background-color: #f5f5f5;
                width: 30%;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Permission Letter Request</h2>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Request ID:</strong> ${actual_request_id}</p>
            </div>
            
            <div class="content">
              <p>Dear Sir/Madam,</p>
              
              <p>I am writing to formally request permission to participate in the following event:</p>
              
              <table class="details-table">
                <tr>
                  <td class="label">Student Name:</td>
                  <td>${student_name}</td>
                </tr>
                <tr>
                  <td class="label">Student ID:</td>
                  <td>${student_id_value}</td>
                </tr>
                <tr>
                  <td class="label">Event Name:</td>
                  <td>${event_details.event_name}</td>
                </tr>
                <tr>
                  <td class="label">Organizer:</td>
                  <td>${event_details.organizer}</td>
                </tr>
                <tr>
                  <td class="label">Event Duration:</td>
                  <td>${new Date(st_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td class="label">Reason for Participation:</td>
                  <td>${reason}</td>
                </tr>
              </table>
              
              <p>I believe this event will contribute significantly to my academic and professional development. 
              I will ensure that all my current academic responsibilities are completed or properly managed during this period.</p>
              
              <p>I kindly request your approval for my participation in this event.</p>
              
              <p>Thank you for your time and consideration.</p>
              
              <div class="signature">
                <p>Respectfully yours,</p>
                <br><br>
                <p>_________________________</p>
                <p>${student_name}</p>
                <p>Student ID: ${student_id_value}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automatically generated permission letter. Request ID: ${actual_request_id}</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
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

    // Step 5: Upload to MinIO
    let minio_object_key;
    let filename;
    
    try {
      // Check if bucket exists, create if it doesn't
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`Bucket '${bucketName}' created successfully`);
      }

      // Create filename and object key
      filename = `permission-letter-${actual_request_id}-${Date.now()}.pdf`;
      minio_object_key = `requests/letters/2025/${filename}`;
      const buffer = Buffer.from(pdfBuffer);
      
      const uploadResult = await minioClient.putObject(
        bucketName,
        minio_object_key,
        buffer,
        buffer.length,
        { 
          'Content-Type': 'application/pdf',
          'X-Amz-Meta-Request-Id': actual_request_id.toString(),
          'X-Amz-Meta-Upload-Date': new Date().toISOString(),
          'X-Amz-Meta-Original-Filename': filename,
          'X-Amz-Meta-Student-Id': student_id_value.toString(),
          'X-Amz-Meta-Event-Id': event_id.toString()
        }
      );

      console.log("File uploaded to MinIO successfully:", uploadResult);

    } catch (minioError) {
      console.error("MinIO upload error:", minioError);
      throw new Error(`MinIO upload failed: ${minioError.message}`);
    }

    // Step 6: Save to permission_letter table
    let perm_id;
    try {
      const insertLetterQuery = `
        INSERT INTO permission_letter (req_id, filename, minio_object_key, created_at, updated_at) 
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING perm_id
      `;

      const letterResult = await client.query(insertLetterQuery, [actual_request_id, filename, minio_object_key]);
      perm_id = letterResult.rows[0].perm_id;
      
      console.log('Permission letter saved to database:', perm_id);

    } catch (dbError) {
      console.error("Database save error:", dbError);
      throw new Error(`Database save failed: ${dbError.message}`);
    }

    // Commit the transaction
    await client.query('COMMIT');
    console.log("Transaction committed successfully");

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Permission letter generated and saved successfully',
      data: {
        request_id: actual_request_id,
        filename: filename,
        perm_id: perm_id,
        event_id: event_id,
        object_key: minio_object_key,
        upload_timestamp: new Date().toISOString(),
        student_name: student_name,
        event_name: event_details.event_name
      }
    });

  } catch (err) {
    console.error("Error:", err);
    
    // Cleanup browser if it exists
    if (browser) {
      try {
        await browser.close();
      } catch (browserError) {
        console.error("Browser cleanup error:", browserError);
      }
    }
    
    // Rollback transaction if it exists
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log("Transaction rolled back");
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }
    
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
    
  } finally {
    if (client) {
      client.release();
    }
  }
});



// 1. Get Permission Letter Details
app.get("/letters/:request_id", async (req, res) => {
  const { request_id } = req.params;
  
  try {
    const query = `
      SELECT 
        perm_id,
        filename, 
        minio_object_key,
        created_at
      FROM permission_letter 
      WHERE req_id = $1
    `;
    const result = await pool.query(query, [request_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Permission letter not found" 
      });
    }

    // Generate MinIO presigned URL for file access
    const { filename, minio_object_key } = result.rows[0];
    const bucketName = 'pdf-documents';
    
    // Generate temporary URL (valid for 1 hour)
    const fileUrl = await minioClient.presignedGetObject(bucketName, minio_object_key, 60 * 60);

    return res.json({ 
      success: true,
      data: {
        ...result.rows[0],
        download_url: fileUrl
      }
    });

  } catch (err) {
    console.error("Error fetching permission letter:", err);
    return res.status(500).json({ 
      success: false,
      error: "Internal Server Error" 
    });
  }
});

// 2. Update Request Status (Approve/Reject Letter)
app.post("/letters/:request_id/status", async (req, res) => {
  const { request_id } = req.params;
  const { status, current_stage, admin_id } = req.body;

  try {
    // Updated valid statuses for new request table
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid status. Must be 'approved' or 'rejected'" 
      });
    }

    const query = `
      UPDATE request 
      SET 
        status = $1,
        current_stage = COALESCE($2, current_stage),
        updated_at = CURRENT_TIMESTAMP
      WHERE request_id = $3
      RETURNING request_id, status, current_stage, updated_at
    `;
    
    const result = await pool.query(query, [status, current_stage, request_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Request not found" 
      });
    }

    return res.json({
      success: true,
      message: `Permission letter ${status}`,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Error updating request status:", err);
    return res.status(500).json({ 
      success: false,
      error: "Internal Server Error" 
    });
  }
});

// 3. Get Pending Permission Letters
app.get("/letters/pending", async (req, res) => {
  try {
    const query = `
      SELECT 
        r.request_id,
        r.status,
        r.current_stage,
        r.submitted_at,
        s.name AS student_name,
        s.roll_number,
        s.email,
        e.event_name,
        e.event_type,
        e.start_date,
        e.end_date,
        pl.perm_id,
        pl.filename,
        pl.minio_object_key,
        pl.created_at as letter_uploaded_at
      FROM request r
      INNER JOIN student s ON r.student_id = s.student_id
      INNER JOIN event e ON r.event_id = e.event_id
      INNER JOIN permission_letter pl ON r.request_id = pl.req_id
      WHERE r.status = 'pending'
      ORDER BY r.submitted_at ASC
    `;
    
    const result = await pool.query(query);

    return res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (err) {
    console.error("Error fetching pending letters:", err);
    return res.status(500).json({ 
      success: false,
      error: "Internal Server Error" 
    });
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
        e.event_id,
        e.event_name,
        e.event_type,
        e.end_date,
        c.certificate_id,
        c.filename,
        c.minio_object_key,
        c.created_at as certificate_uploaded_at,
        r.request_id,
        r.status as request_status
      FROM student s
      INNER JOIN request r ON s.student_id = r.student_id
      LEFT JOIN certificate c ON r.request_id = c.req_id
      INNER JOIN event e ON r.event_id = e.event_id
      WHERE s.student_id = $1
        AND r.status = 'approved'
        AND c.certificate_id IS NOT NULL
      ORDER BY e.end_date DESC, c.created_at DESC;
    `;

    const { rows } = await pool.query(query, [studentId]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "No certificates found for this student" 
      });
    }

    // Group certificates by event
    const eventsMap = new Map();
    
    rows.forEach(row => {
      if (!eventsMap.has(row.event_id)) {
        eventsMap.set(row.event_id, {
          event_id: row.event_id,
          event_name: row.event_name,
          event_type: row.event_type,
          end_date: row.end_date,
          certificates: []
        });
      }
      
      eventsMap.get(row.event_id).certificates.push({
        certificate_id: row.certificate_id,
        filename: row.filename,
        minio_object_key: row.minio_object_key,
        uploaded_at: row.certificate_uploaded_at,
        request_id: row.request_id
      });
    });

    const events = Array.from(eventsMap.values());

    return res.json({
      success: true,
      student: {
        student_id: rows[0].student_id,
        name: rows[0].name,
        roll_number: rows[0].roll_number
      },
      events: events,
      total_certificates: rows.length,
      total_events: events.length
    });

  } catch (err) {
    console.error('Error fetching student certificates:', err);
    return res.status(500).json({ 
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch certificates"
    });
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


app.post("/api/check-user", async (req, res) => {
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
    return res.status(500).json({ exists: false });
  }
});

app.get("/api/requests", async (req, res) => {
  try {
    const { status, uid, limit = 50, offset = 0 } = req.query;
    
    if (!status) {
      return res.status(400).json({ 
        success: false,
        error: 'Status query parameter is required',
        message: 'Please provide status as: pending, approved, or rejected'
      });
    }

    if (!uid) {
      return res.status(400).json({ 
        success: false,
        error: 'Firebase UID is required',
        message: 'Please provide uid parameter'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value',
        message: 'Status must be one of: pending, approved, rejected'
      });
    }

    // Base query with joins
    let query = `
      SELECT 
        r.request_id,
        r.student_id,
        r.submitted_at,
        r.status as request_status,
        r.current_stage,
        s.name AS student_name,
        s.roll_number,
        c.class_name,
        c.section,
        e.event_name,
        e.event_type,
        e.event_level,
        e.organizer,
        e.start_date,
        e.end_date
      FROM request r
      INNER JOIN student s ON r.student_id = s.student_id
      INNER JOIN class c ON s.class_id = c.class_id
      INNER JOIN admin a ON c.class_teacher_id = a.admin_id
      INNER JOIN event e ON r.event_id = e.event_id
      WHERE a.firebase_uid = $1
    `;

    const params = [uid];
    let paramCount = 1;

    // Add status-specific conditions
    if (status.toLowerCase() === 'pending') {
      // For pending: status = 'pending' AND current_stage = 'tutor'
      paramCount++;
      query += ` AND r.status = $${paramCount} AND r.current_stage = $${paramCount + 1}`;
      params.push('pending', 'tutor');
      paramCount++;
    } 
    else if (status.toLowerCase() === 'approved') {
      // For approved: (status = 'pending' AND current_stage = 'super_admin') OR (status = 'approved' AND current_stage = 'completed')
      query += ` AND (
        (r.status = 'pending' AND r.current_stage = 'super_admin') OR 
        (r.status = 'approved' AND r.current_stage = 'completed')
      )`;
    } 
    else if (status.toLowerCase() === 'rejected') {
      // For rejected: status = 'rejected' AND current_stage = 'completed'
      query += ` AND r.status = 'rejected' AND r.current_stage = 'completed'`;
    }

    // Add ordering and pagination
    query += ` ORDER BY r.submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    console.log('Final Query:', query);
    console.log('Parameters:', params);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM request r
      INNER JOIN student s ON r.student_id = s.student_id
      INNER JOIN class c ON s.class_id = c.class_id
      INNER JOIN admin a ON c.class_teacher_id = a.admin_id
      WHERE a.firebase_uid = $1
    `;

    const countParams = [uid];

    // Add same status conditions for count
    if (status.toLowerCase() === 'pending') {
      countQuery += ` AND r.status = $2 AND r.current_stage = $3`;
      countParams.push('pending', 'tutor');
    } 
    else if (status.toLowerCase() === 'approved') {
      countQuery += ` AND (
        (r.status = 'pending' AND r.current_stage = 'super_admin') OR 
        (r.status = 'approved' AND r.current_stage = 'completed')
      )`;
    } 
    else if (status.toLowerCase() === 'rejected') {
      countQuery += ` AND r.status = 'rejected' AND r.current_stage = 'completed'`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total: totalCount,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.rows.length === parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      filters: {
        status: status.toLowerCase(),
        uid: uid
      }
    });

  } catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch requests'
    });
  }
});


// ✅ Add this endpoint if it's missing
app.put("/request/:id/status", async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    
    const { id } = req.params;
    const { status, current_stage, admin_id } = req.body;

    // Updated valid statuses based on your request table
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value',
        message: 'Status must be one of: pending, approved, rejected'
      });
    }

    // Valid stages for workflow progression
    const validStages = ['tutor', 'super_admin', 'completed'];
    if (current_stage && !validStages.includes(current_stage.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stage value',
        message: 'Stage must be one of: tutor, super_admin, completed'
      });
    }

    await client.query('BEGIN');

    // Check if request exists
    const checkQuery = `SELECT * FROM request WHERE request_id = $1`;
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Update request with new status and stage
    const updateQuery = `
      UPDATE request 
      SET 
        status = $1,
        current_stage = COALESCE($2, current_stage),
        updated_at = CURRENT_TIMESTAMP
      WHERE request_id = $3 
      RETURNING request_id, student_id, event_id, status, current_stage, updated_at
    `;

    const result = await pool.query(updateQuery, [
      status.toLowerCase(), 
      current_stage?.toLowerCase() || null, 
      id
    ]);

    // Log the status change (optional - for audit trail)
    if (admin_id) {
      const logQuery = `
        INSERT INTO request_status_log (request_id, admin_id, old_status, new_status, changed_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      
      const oldStatus = checkResult.rows[0].status;
      await client.query(logQuery, [id, admin_id, oldStatus, status.toLowerCase()]);
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: result.rows[0]
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error updating request status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update request status'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});



app.get("/requeststudent/:uid", async (req, res) => {
  try {
    const { status } = req.query;
    const { uid } = req.params;

    if (!status) {
      return res.status(400).json({ 
        success: false,
        error: 'Status query parameter is required',
        message: 'Please provide status as: pending, approved, or rejected'
      });
    }

    // Updated valid statuses based on your new request table
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value',
        message: 'Status must be one of: pending, approved, rejected'
      });
    }

    const query = `
    SELECT 
    e.event_id,              
    e.event_name,
    e.event_type,
    e.end_date,
    e.organizer,
    r.status as permission_letter_status, 
    r.current_stage,
    r.submitted_at,
    r.updated_at,
    r.created_at as request_created_at
  FROM student s
  INNER JOIN request r ON s.student_id = r.student_id
  INNER JOIN event e ON r.event_id = e.event_id
  LEFT JOIN permission_letter pl ON r.request_id = pl.req_id  
  WHERE s.firebase_uid = $1
    AND r.status = $2
  ORDER BY r.created_at DESC;
`;


    const result = await pool.query(query, [uid, status.toLowerCase()]);

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      status_filter: status.toLowerCase()
    });

  } catch (err) {
    console.error("Unable to fetch student requests:", err);
    return res.status(500).json({
      success: false,
      error: "Unable to fetch student requests",
      message: "Database error occurred"
    });
  }
});


app.get("/certificateshow/:uid/:filter", async (req, res) => {
  try {
    const { uid, filter } = req.params;
    
    // Convert filter to boolean (assuming "true" or "false" string values)
    const certificateUploaded = filter === "true";

    
    const query = `
  SELECT 
    r.request_id,
    e.event_id,
    e.event_name,
    e.event_type,
    e.end_date,
    e.organizer,
    e.start_date,
    c.filename,
    c.minio_object_key,
    c.created_at as certificate_uploaded_at,
    r.status as request_status,
    r.current_stage,
    e.permission_required,
    'with_request' as record_type
  FROM student s
  INNER JOIN request r 
    ON s.student_id = r.student_id
  INNER JOIN event e 
    ON r.event_id = e.event_id
  LEFT JOIN certificate c
    ON r.request_id = c.req_id
  WHERE s.firebase_uid = $1
    AND (
      (e.permission_required = true AND r.status = 'approved') OR
      (e.permission_required = false)
    )
    AND e.certificate_upload = $2
    
  ORDER BY e.end_date DESC;
`;


    const result = await pool.query(query, [uid, certificateUploaded]);
    
    console.log(`Found ${result.rows.length} certificates for user ${uid}`);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
    
  } catch (err) {
    console.error("Certificate show error:", err);
    return res.status(500).json({ 
      success: false,
      error: "Database error" 
    });
  }
});

app.post("/upload-certificate/:eventId", upload.single("certificate"), async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    
    const BUCKET = "certificate";
    const eventId = req.params.eventId;
    
    console.log('📤 Certificate upload for event:', eventId);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalFilename = req.file.originalname;
    const pdfBuffer = req.file.buffer;

    // Check if bucket exists
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET, "us-east-1");
    }

    // Create structured object key
    const timestamp = Date.now();
    const filename = `certificate-${eventId}-${timestamp}.pdf`;
    const minio_object_key = `certificates/events/${eventId}/${filename}`;

    // Upload to MinIO
    await minioClient.putObject(BUCKET, minio_object_key, pdfBuffer, pdfBuffer.length, {
      "Content-Type": "application/pdf",
      "X-Amz-Meta-Event-Id": eventId.toString(),
      "X-Amz-Meta-Upload-Date": new Date().toISOString(),
      "X-Amz-Meta-Original-Filename": originalFilename
    });

    await client.query("BEGIN");

    // Check if this is a request_id or event_id
    const checkRequest = await client.query(
      `SELECT request_id, event_id FROM request WHERE request_id = $1`,
      [eventId]
    );

    let certificateInserts = 0;
    let actualEventId = eventId; // Track the actual event_id for the update

    if (checkRequest.rows.length > 0) {
      // This is a request_id - insert one certificate record
      actualEventId = checkRequest.rows[0].event_id; // Get the actual event_id
      
      const insertQuery = `
        INSERT INTO certificate (req_id, filename, minio_object_key, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING certificate_id
      `;
      
      const result = await client.query(insertQuery, [eventId, originalFilename, minio_object_key]);
      certificateInserts = 1;
      
      console.log('✅ Certificate inserted for request_id:', eventId);
      
    } else {
      // This is an event_id
      const eventCheck = await client.query(
        `SELECT event_id, permission_required FROM event WHERE event_id = $1`,
        [eventId]
      );

      if (eventCheck.rows.length === 0) {
        throw new Error('Event not found');
      }

      const event = eventCheck.rows[0];
      actualEventId = event.event_id;

      if (!event.permission_required) {
        // For no-permission events, create certificates for all approved requests
        const insertQuery = `
          INSERT INTO certificate (req_id, filename, minio_object_key, created_at)
          SELECT r.request_id, $2, $3, CURRENT_TIMESTAMP
          FROM request r
          WHERE r.event_id = $1 AND r.status = 'approved'
          RETURNING certificate_id
        `;
        
        const result = await client.query(insertQuery, [eventId, originalFilename, minio_object_key]);
        certificateInserts = result.rowCount;
        
        console.log('✅ Certificates inserted for event_id:', eventId, 'Count:', certificateInserts);
      } else {
        // This should be a request_id for permission-required events
        throw new Error('Permission-required events need a request_id, not event_id');
      }
    }

    // ✅ UPDATE: Set certificate_upload = true to indicate certificate has been uploaded
    await client.query(
      `UPDATE event 
       SET certificate_upload = true, updated_at = CURRENT_TIMESTAMP 
       WHERE event_id = $1`,
      [actualEventId]
    );

    await client.query("COMMIT");
    
    console.log('🎉 Upload complete! Event updated and certificates created:', certificateInserts);
    
    return res.json({
      success: true,
      message: "Certificate uploaded successfully",
      data: {
        event_id: actualEventId,
        filename: originalFilename,
        minio_object_key: minio_object_key,
        certificates_created: certificateInserts,
        bucket_name: BUCKET
      }
    });

  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Certificate upload error:", err);
    return res.status(500).json({ 
      error: "Server error during certificate upload",
      details: err.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});



app.get("/superadmin/notifications", async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const query = `
      SELECT 
        r.request_id,
        r.submitted_at,
        s.name AS student_name,
        s.roll_number,
        c.class_name,
        e.event_name,
        e.event_type,
        e.event_level,
        e.organizer,
        e.start_date,
        e.end_date
      FROM request r
      INNER JOIN student s ON r.student_id = s.student_id
      INNER JOIN class c ON s.class_id = c.class_id
      INNER JOIN event e ON r.event_id = e.event_id
      LEFT JOIN permission_letter pl ON r.request_id = pl.req_id
      WHERE r.current_stage = 'super_admin' 
        AND r.status = 'pending'
      ORDER BY r.submitted_at ASC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [parseInt(limit), parseInt(offset)]);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM request r
      WHERE r.current_stage = 'super_admin' 
        AND r.status = 'pending'
    `;

    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].total);

    return res.status(200).json({
      success: true,
      data: {
        notifications: result.rows,
        total: totalCount,
      }
    });

  } catch (error) {
    console.error('Error fetching superadmin notifications:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch notifications'
    });
  }
});

app.get("/api/superrequest", async (req, res) => {
  try {
    const { status } = req.query;
    
    if (!status) {
      return res.status(400).json({ 
        success: false,
        error: 'Status query parameter is required',
        message: 'Please provide status as: pending, approved, or rejected'
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value',
        message: 'Status must be one of: pending, approved, rejected'
      });
    }

    let query = `
      SELECT 
        r.request_id,
        s.name,
        s.roll_number,
        e.event_name,
        e.event_type,
        e.organizer,
        e.start_date,
        e.end_date,
        r.status as permission_letter_status,
        r.current_stage,
        r.approved_by,
        r.rejected_by,
        r.created_at,
        r.updated_at
      FROM request r
      INNER JOIN student s ON r.student_id = s.student_id
      INNER JOIN event e ON e.event_id = r.event_id
    `;

    let params = [];

    if (status.toLowerCase() === 'pending') {
      query += ` WHERE r.status = 'pending' AND r.current_stage = 'super_admin'`;
    } else if (status.toLowerCase() === 'approved') {
      query += ` WHERE r.status = 'approved' AND r.approved_by = 'HOD'`;
    } else if (status.toLowerCase() === 'rejected') {
      query += ` WHERE r.status = 'rejected' AND r.rejected_by = 'HOD'`;
    }

    query += ` ORDER BY r.created_at DESC`;

    console.log('Query:', query);

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch requests'
    });
  }
});


// REMOVE the single endpoint and keep only this bulk endpoint
app.put("/api/superrequests/update", async (req, res) => {
  let { requestIds, status } = req.body;
  let client;
  
  try {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status' 
      });
    }

    // Convert single ID to array for uniform processing
    if (!Array.isArray(requestIds)) {
      requestIds = [requestIds];
    }
    
    const cleanRequestIds = requestIds.filter(id => id !== null && id !== undefined && id !== '');
    
    if (cleanRequestIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid request IDs provided' 
      });
    }

    const numericIds = [];
    for (const id of cleanRequestIds) {
      const numId = parseInt(id);
      if (isNaN(numId)) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid request ID: ${id}` 
        });
      }
      numericIds.push(numId);
    }

    client = await pool.connect();
    await client.query('BEGIN');
    
    let updateQuery, params;
    
    if (status === 'approved') {
      updateQuery = `
        UPDATE request 
        SET 
          status = $1,
          current_stage = $2,
          approved_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE request_id = ANY($4::int[]) 
          AND current_stage = 'super_admin'
          AND status = 'pending'
        RETURNING request_id, status, current_stage, approved_by, updated_at
      `;
      params = ['approved', 'completed', 'HOD', numericIds];
    } else if (status === 'rejected') {
      updateQuery = `
        UPDATE request 
        SET 
          status = $1,
          current_stage = $2,
          rejected_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE request_id = ANY($4::int[]) 
          AND current_stage = 'super_admin'
          AND status = 'pending'
        RETURNING request_id, status, current_stage, rejected_by, updated_at
      `;
      params = ['rejected', 'completed', 'HOD', numericIds];
    }
    
    const result = await client.query(updateQuery, params);
    await client.query('COMMIT');
    
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
      message: `${updated.length} request(s) ${status} successfully by HOD`,
      details: updated,
      operation_type: numericIds.length === 1 ? 'single' : 'bulk',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    console.error('Update operation failed:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Update failed', 
      details: error.message,
      failed_ids: requestIds || []
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});



app.get("/superadmin/getnamesandids" , async(req,res)=>{
  try{
    query = `
    SELECT admin_id,name from 
    admin WHERE role = 'admin'
    `;
    const result = await pool.query(query);

    return res.status(200).json(result.rows);
  }
  catch(err){
    return res.status(500).json({
      message : `no teachers found`
    });
  }
});
app.put("/superadmin/classassignment", async (req, res) => {
  try {
    const { schedules } = req.body; 
    
    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({
        error: 'Invalid schedules data format'
      });
    }

    console.log('Received schedules:', schedules);

    for (const schedule of schedules) {
      const { teacherId, className, sectionName } = schedule;
      
      console.log(`Processing: Teacher ${teacherId} -> Class ${className} Section ${sectionName}`);

      // First, find the class_id and current teacher for the class
      const findClassQuery = `
        SELECT class_id, class_teacher_id 
        FROM class 
        WHERE class_name = $1 AND section = $2
      `;
      
      const classResult = await pool.query(findClassQuery, [className, sectionName]);
      
      if (classResult.rows.length === 0) {
        console.error(`No class found for Class ${className} Section ${sectionName}`);
        continue; // Skip this assignment
      }
      
      const classId = classResult.rows[0].class_id;
      const currentTeacherId = classResult.rows[0].class_teacher_id;
      
      console.log(`Found class_id: ${classId} for Class ${className} Section ${sectionName}`);
      console.log(`Current teacher_id: ${currentTeacherId}`);

      // If there's an existing teacher, change their role back to admin
      if (currentTeacherId !== null) {
        const demoteTeacherQuery = 'UPDATE admin SET role = $1 WHERE admin_id = $2';
        await pool.query(demoteTeacherQuery, ['admin', currentTeacherId]);
        console.log(`Changed admin ${currentTeacherId} role back to admin`);
      }

      // Update the new teacher's role to tutor
      const roleUpdateQuery = 'UPDATE admin SET role = $1 WHERE admin_id = $2';
      await pool.query(roleUpdateQuery, ['tutor', teacherId]);
      console.log(`Updated admin ${teacherId} role to tutor`);

      // Assign new teacher to class
      const classUpdateQuery = 'UPDATE class SET class_teacher_id = $1 WHERE class_id = $2';
      const updateResult = await pool.query(classUpdateQuery, [teacherId, classId]);
      console.log(`Updated class_id ${classId} with teacher_id ${teacherId}, affected rows: ${updateResult.rowCount}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully assigned tutors to classes`
    });

  } catch (err) {
    console.error('Assignment error:', err);
    return res.status(500).json({
      success: false,
      error: "Failed to assign tutors",
      details: err.message
    });
  }
});


app.post("/superadmin/create",async (req,res)=>{
  const { name,uid,email,role } = req.body;
  try{
    const query = `
    INSERT INTO admin (firebase_uid,name,email,role,created_at,updated_at)
    VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    RETURNING admin_id,name,email,role,created_at
    `;
    const result = await pool.query(query,[uid,name,email,role]);
    return res.status(200).json({
      message : `Admin created successfully`,
      data : result.rows[0]
    });
  }
  catch(err){
    console.error('Error creating admin:', err);
    return res.status(500).json({
      error: "Failed to create admin",
      details: err.message
    });
  }
});

app.get("/superadmin/getassignments",async (req,res)=>{
  try{
    const query = `
    SELECT c.class_name,c.section,a.admin_id,a.name  from 
    class c
    LEFT JOIN admin a ON c.class_teacher_id = a.admin_id
    WHERE a.role = 'tutor'
    `;
    const result = await pool.query(query);

    return res.status(200).json(result.rows);
  }
  catch(err){
    return res.status(500).json({
      message : `no assignments found`
    });
  }
});
app.get('/get-certificate/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    console.log(`🏆 Certificate request for ID: ${requestId}`);
    
    const query = `
      SELECT 
        c.filename, 
        c.minio_object_key,
        c.created_at,
        r.student_id,
        r.event_id
      FROM certificate c
      JOIN request r ON c.req_id = r.request_id
      WHERE c.req_id = $1
      ORDER BY c.created_at DESC
      LIMIT 1
    `;
    
    console.log(`🔍 Executing query with ID: ${requestId}`);
    
    const result = await pool.query(query, [requestId]);
    
    console.log(`📊 Query result: ${result.rows.length} rows found`);
    
    if (result.rows.length === 0) {
      console.log(`❌ No certificate found for request ID: ${requestId}`);
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
        debug: { requestId, timestamp: new Date().toISOString() }
      });
    }
    
    const { filename, minio_object_key } = result.rows[0];
    
    console.log(`📄 Found certificate: ${filename}`);
    console.log(`🔑 MinIO key: ${minio_object_key}`);
    
    // Generate presigned URL
    const presignedUrl = await minioClient.presignedGetObject(
      'certificate',
      minio_object_key,
      2 * 60 * 60
    );
    
    console.log(`✅ Generated presigned URL successfully`);
    console.log(`🔗 URL: ${presignedUrl}`);
    res.json({
      success: true,
      url: presignedUrl,
      filename: filename
    });
    
  } catch (error) {
    console.error('❌ Error in get-certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      debug: error.message
    });
  }
});


app.get('/get-permission-letter/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const query = `SELECT filename, minio_object_key FROM permission_letter WHERE req_id = $1`;
    const result = await pool.query(query, [requestId]);
    console.log(`Fetched permission letter for request ID: ${requestId}`);
    console.log(`Query result rows: ${result.rows.length}`);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    const { filename, minio_object_key } = result.rows[0];
    
    // Generate presigned URL with download headers
    const downloadUrl = await minioClient.presignedGetObject(
      'permissionletters',
      minio_object_key,
      60 * 60, // 1 hour
      {
        'response-content-disposition': `attachment; filename="${filename}"`
      }
    );
    console.log(`Generated download URL for ${filename}`);
    console.log(`Download URL: ${downloadUrl}`);
    
    res.json({
      success: true,
      download_url: downloadUrl,
      filename: filename
    });
    
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ success: false, error: 'Download failed' });
  }
});

app.get("/superadmin/dashboard-stats", async (req, res) => {
  try {
    const { timeframe } = req.query; // 'month' or 'lifetime' (default)
    
    // Set date filter based on timeframe
    let dateFilter = '';
    if (timeframe === 'month') {
      dateFilter = `AND r.created_at >= CURRENT_DATE - INTERVAL '1 month'`;
    }
    // For 'lifetime' or no timeframe, no date filter is applied

    // Get statistics with your specific conditions and timeframe
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN r.status = 'pending' AND r.current_stage = 'super_admin' THEN 1 END) as pending_count,
        COUNT(CASE WHEN r.status = 'rejected' AND r.rejected_by = 'super_admin' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_count
      FROM request r
      WHERE 1=1 ${dateFilter};
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        statistics: {
          pending_count: parseInt(stats.pending_count),
          approved_count: parseInt(stats.approved_count),
          rejected_count: parseInt(stats.rejected_count)
        },
        timeframe: timeframe || 'lifetime'
      }
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
      message: err.message
    });
  }
});
 
// Get statistics for Admin (Class Teacher) dashboard - COUNTS ONLY
app.get("/admin/dashboard-stats", async (req, res) => {
  try {
    const { uid, timeframe } = req.query;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        error: "Firebase UID is required"
      });
    }

    // Simple date filter
    let dateFilter = '';
    if (timeframe === 'month') {
      dateFilter = `AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    // Get admin name
    const adminResult = await pool.query(
      `SELECT name FROM admin WHERE firebase_uid = $1`, 
      [uid]
    );
    
    if (adminResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      });
    }

    // ✅ FIXED: Use LEFT JOIN to handle admin with no students/requests
    const statsQuery = `
      SELECT 
        COALESCE(COUNT(CASE WHEN r.status = 'pending' THEN 1 END), 0) as pending_count,
        COALESCE(COUNT(CASE WHEN r.status = 'approved' THEN 1 END), 0) as approved_count,
        COALESCE(COUNT(CASE WHEN r.status = 'rejected' THEN 1 END), 0) as rejected_count
      FROM admin a
      LEFT JOIN class c ON a.admin_id = c.class_teacher_id
      LEFT JOIN student s ON c.class_id = s.class_id
      LEFT JOIN request r ON s.student_id = r.student_id ${dateFilter}
      WHERE a.firebase_uid = $1
    `;

    // Run single query
    const statsResult = await pool.query(statsQuery, [uid]);

    // ✅ Safe response - only counts
    return res.json({
      success: true,
      data: {
        statistics: {
          pending_count: parseInt(statsResult.rows[0]?.pending_count || 0),
          approved_count: parseInt(statsResult.rows[0]?.approved_count || 0),
          rejected_count: parseInt(statsResult.rows[0]?.rejected_count || 0)
        },
        admin_name: adminResult.rows[0].name
      }
    });

  } catch (err) {
    console.error("Dashboard error:", err.message);
    console.error("Stack:", err.stack);
    return res.status(500).json({
      success: false,
      error: "Failed to load dashboard",
      details: err.message
    });
  }
});

// Simple endpoint to get permission letter URL
// Simple endpoint to get permission letter URL
app.get('/api/pdf/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Get file path from database
    const query = `
      SELECT minio_object_key, filename 
      FROM permission_letter 
      WHERE req_id = $1
    `;
    
    const result = await pool.query(query, [requestId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { minio_object_key, filename } = result.rows[0];

    // Generate simple presigned URL (24 hours)
    const url = await minioClient.presignedGetObject(
      'permissionletters', 
      minio_object_key, 
      24 * 60 * 60
    );

    res.json({ 
      success: true, 
      url: url,
      filename: filename 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get URL' });
  }
});

app.get('/api/certificate/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    console.log('Certificate request for ID:', requestId);
    
    // Get certificate file path from database
    const query = `
      SELECT minio_object_key, filename 
      FROM certificate 
      WHERE req_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [requestId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Certificate not found' 
      });
    }

    const { minio_object_key, filename } = result.rows[0];

    // Generate presigned URL for certificate bucket
    const url = await minioClient.presignedGetObject(
      'certificate', 
      minio_object_key, 
      24 * 60 * 60 // 24 hours
    );

    res.json({ 
      success: true, 
      url: url,
      filename: filename 
    });

  } catch (error) {
    console.error('Error in certificate endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get certificate URL',
      details: error.message 
    });
  }
});

app.get("/api/stats/certificates", async (req, res) => {
  try {
    const { year, section, timeline } = req.query;

    if (!year || !section || !timeline) {
      return res.status(400).json({ message: "Year, section, and timeline required" });
    }

    if (!year || !section) {
      return res.status(400).json({ message: "Invalid class format" });
    }

    // 1️⃣ Get class_id
    const classResult = await pool.query(
      `SELECT class_id FROM class WHERE class_name = $1 AND section = $2`,
      [year, section]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }

    const classId = classResult.rows[0].class_id;

    // 2️⃣ Get student IDs
    const studentsResult = await pool.query(
      `SELECT student_id FROM student WHERE class_id = $1`,
      [classId]
    );

    const studentIds = studentsResult.rows.map(r => r.student_id);
    if (studentIds.length === 0) {
      return res.json({ total_certificates: 0, categories: {} });
    }

    // 3️⃣ Get event IDs
    const eventResult = await pool.query(
      `SELECT DISTINCT event_id FROM request WHERE student_id = ANY($1)`,
      [studentIds]
    );

    const eventIds = eventResult.rows.map(r => r.event_id);
    if (eventIds.length === 0) {
      return res.json({ total_certificates: 0, categories: {} });
    }

    // 4️⃣ Timeline condition
    let timeCondition = "";
    if (timeline !== "all") {
      timeCondition = `AND updated_at >= NOW() - INTERVAL '${timeline} months'`;
    }

    // 5️⃣ Final aggregation
    const finalQuery = `
      SELECT event_type, COUNT(*) AS event_count
      FROM event
      WHERE certificate_upload = TRUE
        AND event_id = ANY($1)
        ${timeCondition}
      GROUP BY event_type
    `;

    const finalResult = await pool.query(finalQuery, [eventIds]);

    const categories = {};
    let totalCertificates = 0;

    finalResult.rows.forEach(row => {
      categories[row.event_type] = Number(row.event_count);
      totalCertificates += Number(row.event_count);
    });

    return res.json({
      total_certificates: totalCertificates,
      categories
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/search/person", async (req, res) => {
  try {
    const { nameid } = req.query;
    
    let query = `
      SELECT 
  s.student_id,
  s.name,
  s.roll_number,
  s.firebase_uid,
  s.class_id,
  c.class_name,
  c.section
FROM student s
JOIN class c
  ON s.class_id = c.class_id
WHERE s.name ILIKE $1
   OR s.roll_number ILIKE $1
LIMIT 20;

    `;
    
    const result = await pool.query(query, [`${nameid}%`]);


    
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/student/:studentId/details", async (req, res) => {
  try {
    const { studentId } = req.params;

    const sql = `
      SELECT
      r.request_id,
      r.status AS request_status,
      r.current_stage,

      e.event_id,
      e.event_name,
      e.event_type,
      e.created_at::date AS date,

      c.certificate_id,
      c.filename,
      c.minio_object_key
    FROM request r
    JOIN event e
      ON r.event_id = e.event_id
    JOIN certificate c
      ON c.req_id = r.request_id
    WHERE r.student_id = $1
    ORDER BY e.created_at DESC;

    `;



    const result = await pool.query(sql, [studentId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



const PORT = 3000;
app.listen(PORT,()=>{
    console.log("Listening" + PORT);
});


