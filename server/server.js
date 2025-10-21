const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
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
        WHERE email = $1
      `;
      
      db.get(selectQuery, [email], (err, row) => {
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
        
        // Compare passwords (plain text for now)
        if (row.password === password) {
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