const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { db } = require('../database');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Use timestamp to avoid conflicts, we'll rename it after getting form data
        const timestamp = Date.now();
        const fileExtension = path.extname(file.originalname);
        cb(null, `temp_${timestamp}${fileExtension}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Admin login
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        db.get('SELECT * FROM admin_users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            req.session.authenticated = true;
            req.session.userId = user.id;
            res.json({ success: true, message: 'Login successful' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin logout
router.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logout successful' });
});

// Upload daily program
router.post('/admin/upload', requireAuth, upload.single('programFile'), (req, res) => {
    console.log('Upload request received');
    try {
        const { programDate, language } = req.body;
        const file = req.file;
        
        console.log('File received:', file ? 'Yes' : 'No');
        console.log('Program date:', programDate);
        console.log('Language:', language);
        
        if (!file) {
            console.log('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        if (!programDate || !language) {
            console.log('Missing date or language');
            // Clean up uploaded file if validation fails
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ error: 'Date and language are required' });
        }
        
        const allowedLanguages = ['English', 'Turkish', 'Spanish', 'German'];
        if (!allowedLanguages.includes(language)) {
            console.log('Invalid language:', language);
            // Clean up uploaded file if validation fails
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ error: 'Invalid language' });
        }
        
        // Debug log for incoming values
        console.log('Received programDate:', JSON.stringify(programDate), 'language:', JSON.stringify(language));
        
        // Sanitize inputs for filename
        const safeDate = String(programDate).replace(/[^0-9\-]/g, '');
        const safeLanguage = String(language).replace(/[^a-zA-Z]/g, '');
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const newFileName = `${safeDate}_${safeLanguage}${fileExtension}`;
        const newFilePath = path.join('uploads', newFileName);
        
        // Debug log for filename generation
        console.log('Safe date:', JSON.stringify(safeDate));
        console.log('Safe language:', JSON.stringify(safeLanguage));
        console.log('New filename:', JSON.stringify(newFileName));
        console.log('New file path:', JSON.stringify(newFilePath));
        console.log('File path bytes:', Array.from(newFilePath).map(c => c.charCodeAt(0)));
        
        // Clean the file path to remove any invisible characters
        const cleanFilePath = newFilePath.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        console.log('Clean file path:', JSON.stringify(cleanFilePath));
        console.log('Clean file path bytes:', Array.from(cleanFilePath).map(c => c.charCodeAt(0)));
        
        // Rename the file to the proper format
        console.log('Renaming file from:', file.path, 'to:', newFilePath);
        fs.renameSync(file.path, newFilePath);
        console.log('File renamed successfully');
        
        // Check if program for this date and language already exists
        db.get('SELECT id FROM daily_programs WHERE program_date = ? AND language = ?', 
            [programDate, language], (err, existing) => {
            if (err) {
                console.log('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (existing) {
                console.log('Updating existing program');
                // Update existing record
                db.run('UPDATE daily_programs SET file_path = ?, file_type = ?, uploaded_at = CURRENT_TIMESTAMP WHERE program_date = ? AND language = ?',
                    [cleanFilePath, fileExtension, programDate, language], (err) => {
                    if (err) {
                        console.log('Update error:', err);
                        return res.status(500).json({ error: 'Failed to update program' });
                    }
                    console.log('Program updated successfully');
                    res.json({ success: true, message: 'Program updated successfully' });
                });
            } else {
                console.log('Inserting new program');
                // Insert new record
                db.run('INSERT INTO daily_programs (program_date, language, file_path, file_type) VALUES (?, ?, ?, ?)',
                    [programDate, language, cleanFilePath, fileExtension], (err) => {
                    if (err) {
                        console.log('Insert error:', err);
                        return res.status(500).json({ error: 'Failed to save program' });
                    }
                    console.log('Program inserted successfully');
                    res.json({ success: true, message: 'Program uploaded successfully' });
                });
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up file if there's an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
});

// Get all programs (admin)
router.get('/admin/programs', requireAuth, (req, res) => {
    db.all('SELECT * FROM daily_programs ORDER BY program_date DESC, language', (err, programs) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Sending programs to admin dashboard:');
        programs.forEach(program => {
            console.log(`Program ${program.id}: file_path = ${JSON.stringify(program.file_path)}`);
        });
        
        res.json(programs);
    });
});

// Delete program (admin)
router.delete('/admin/programs/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT file_path FROM daily_programs WHERE id = ?', [id], (err, program) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        // Delete file from filesystem
        if (fs.existsSync(program.file_path)) {
            fs.unlinkSync(program.file_path);
        }
        
        // Delete from database
        db.run('DELETE FROM daily_programs WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete program' });
            }
            res.json({ success: true, message: 'Program deleted successfully' });
        });
    });
});

// Get programs for today and tomorrow (public)
router.get('/programs', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    db.all('SELECT * FROM daily_programs WHERE program_date IN (?, ?) ORDER BY program_date, language', 
        [today, tomorrow], (err, programs) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Group programs by date
        const groupedPrograms = {};
        programs.forEach(program => {
            if (!groupedPrograms[program.program_date]) {
                groupedPrograms[program.program_date] = {};
            }
            groupedPrograms[program.program_date][program.language] = {
                id: program.id,
                file_path: program.file_path,
                file_type: program.file_type,
                uploaded_at: program.uploaded_at
            };
        });
        
        res.json(groupedPrograms);
    });
});

// Generate QR code
router.get('/qr-code', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    QRCode.toDataURL(baseUrl, (err, url) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to generate QR code' });
        }
        res.json({ qrCode: url });
    });
});

module.exports = router; 