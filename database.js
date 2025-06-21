const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'cruise_programs.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create admin users table
        db.run(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating admin_users table:', err);
                reject(err);
                return;
            }
            
            // Create daily programs table
            db.run(`
                CREATE TABLE IF NOT EXISTS daily_programs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    program_date DATE NOT NULL,
                    language TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(program_date, language)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating daily_programs table:', err);
                    reject(err);
                    return;
                }
                
                // Create default admin user if not exists
                createDefaultAdmin().then(() => {
                    console.log('Database initialized successfully');
                    resolve();
                }).catch(reject);
            });
        });
    });
}

// Create default admin user
async function createDefaultAdmin() {
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123';
    
    return new Promise((resolve, reject) => {
        // Check if admin user already exists
        db.get('SELECT id FROM admin_users WHERE username = ?', [defaultUsername], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!row) {
                // Create default admin user
                bcrypt.hash(defaultPassword, 10, (err, hash) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    db.run('INSERT INTO admin_users (username, password) VALUES (?, ?)', 
                        [defaultUsername, hash], (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        console.log('Default admin user created: username=admin, password=admin123');
                        resolve();
                    });
                });
            } else {
                resolve();
            }
        });
    });
}

module.exports = {
    db,
    initializeDatabase
}; 