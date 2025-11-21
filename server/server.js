const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create users table if it doesn't exist
    createUsersTable();
    createMediaTable();
  }
});

// Create users table
function createUsersTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready');
    }
  });
}

function createMediaTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cloudinary_public_id TEXT NOT NULL,
      cloudinary_url TEXT NOT NULL,
      resource_type TEXT,
      format TEXT,
      duration REAL,
      bytes INTEGER,
      width INTEGER,
      height INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  
  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating media table:', err.message);
    } else {
      console.log('Media table ready');
    }
  });
}

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert user into database
    const insertQuery = `
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `;
    
    db.run(insertQuery, [username, email, hashedPassword], function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({
            success: false,
            message: 'Username or email already exists'
          });
        }
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        username,
        email,
        userId: this.lastID
      });
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/login', (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      
      // Query database for user
      const selectQuery = `
        SELECT id, username, email, password 
        FROM users 
        WHERE email = ?
      `;
      
      db.get(selectQuery, [email], async (err, row) => {
        if (err) {
          console.error('Database error:', err.message);
          return res.status(500).json({
            success: false,
            message: 'Internal server error'
          });
        }
        
        if (!row) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }
        
        const passwordMatch = await bcrypt.compare(password, row.password)
        if (passwordMatch) {
          res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
              id: row.id,
              username: row.username,
              email: row.email
            }
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

// Add this endpoint to your server.js file
app.post('/user_saved_media', (req, res) => {
  try {
    const { url, user_id, public_id, created_at, resource_type, duration, bytes, width, height, format } = req.body;
    // Validate required fields
    if (!url || !user_id || !public_id) {
      return res.status(400).json({
        success: false,
        message: 'url, user_id, and file_name are required'
      });
    }
    // Insert media into database
    // Mapping: url -> cloudinary_url, file_name -> cloudinary_public_id, bytes -> file_size
    const insertQuery = `
      INSERT INTO media (user_id, cloudinary_public_id, cloudinary_url, bytes, duration, format, resource_type, created_at, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertQuery, [
      user_id,
      public_id, 
      url,       // This is the secure_url from Cloudinary
      bytes || null,
      duration || null,
      format || null,
      resource_type || null,
      created_at,
      width,
      height
    ], function(err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to save media',
          error: err.message
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Media saved successfully',
        mediaId: this.lastID
      });
    });
    
  } catch (error) {
    console.error('Save media error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/get_user_saved_media', (req, res) => {
  try {
    const { user_id } = req.query;
    
    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }
    // Query database for user's media
    const selectQuery = `
      SELECT 
        user_id,
        cloudinary_public_id as public_id,
        cloudinary_url as secure_url,
        resource_type,
        format,
        duration,
        bytes,
        width,
        height,
        created_at
      FROM media 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    
    db.all(selectQuery, [user_id], (err, rows) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch media',
          error: err.message
        });
      }
      
      res.status(200).json({
        success: true,
        media: rows || []
      });
    });
    
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Signup endpoint: http://localhost:${PORT}/signup`);
});
// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});