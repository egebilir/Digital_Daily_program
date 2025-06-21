# Miray Cruises - Gemini Daily Program Management System

A web application for managing and displaying daily programs for Miray Cruises' Gemini ship. End users can scan a QR code to access daily programs, while administrators can upload and manage program files in multiple languages.

## Features

### For End Users
- **QR Code Access**: Scan QR code to access daily programs
- **Multi-language Support**: Programs available in English, Turkish, Spanish, and German
- **Today & Tomorrow View**: View programs for current and next day
- **File Support**: View PDF and image files directly in browser
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### For Administrators
- **Secure Login**: Admin authentication system
- **File Upload**: Upload daily programs as PDF or images
- **Multi-language Management**: Upload programs for each language separately
- **Program Management**: View, delete, and manage all uploaded programs
- **Dashboard**: Clean interface for program management

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite (easily migratable to MySQL/PostgreSQL)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **File Upload**: Multer middleware
- **Authentication**: Express sessions with bcrypt password hashing
- **QR Code**: QRCode library for generation
- **Styling**: Custom CSS with Font Awesome icons

## Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd cruise-daily-program
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Main application: http://localhost:3000
   - Admin panel: http://localhost:3000/admin/login
   - Default admin credentials: `admin` / `admin123`

## Project Structure

```
cruise-daily-program/
├── public/                 # Frontend files
│   ├── index.html         # Main user page
│   ├── admin-login.html   # Admin login page
│   └── admin-dashboard.html # Admin dashboard
├── routes/
│   └── api.js            # API routes
├── uploads/              # Uploaded files (created automatically)
├── database.js           # Database setup and configuration
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## API Endpoints

### Public Endpoints
- `GET /` - Main user page
- `GET /api/programs` - Get today's and tomorrow's programs
- `GET /api/qr-code` - Generate QR code for the main page

### Admin Endpoints (Authentication Required)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `POST /api/admin/upload` - Upload daily program
- `GET /api/admin/programs` - Get all programs
- `DELETE /api/admin/programs/:id` - Delete program

## Usage

### For Administrators

1. **Login to Admin Panel**
   - Go to http://localhost:3000/admin/login
   - Use default credentials: `admin` / `admin123`

2. **Upload Daily Programs**
   - Select the program date
   - Choose the language (English, Turkish, Spanish, German)
   - Upload PDF or image file
   - Click "Upload Program"

3. **Manage Programs**
   - View all uploaded programs in the table
   - Click "View" to preview files
   - Click "Delete" to remove programs

### For End Users

1. **Access Programs**
   - Scan the QR code or visit http://localhost:3000
   - View programs for today and tomorrow
   - Select your preferred language
   - Click "View Program" to open files

## File Requirements

- **Supported Formats**: PDF, JPG, JPEG, PNG, GIF
- **File Naming**: Automatically named as `YYYY-MM-DD_Language.ext`
- **Storage**: Files stored locally in `uploads/` directory

## Security Features

- **Password Hashing**: Admin passwords encrypted with bcrypt
- **Session Management**: Secure session handling
- **File Validation**: Only allowed file types accepted
- **Authentication Middleware**: Protected admin routes

## Customization

### Changing Default Admin Credentials
Edit the `createDefaultAdmin()` function in `database.js`:
```javascript
const defaultUsername = 'your-username';
const defaultPassword = 'your-password';
```

### Adding New Languages
1. Update the `allowedLanguages` array in `routes/api.js`
2. Add language options in `public/admin-dashboard.html`
3. Update language mappings in `public/index.html`

### Database Migration
To use MySQL or PostgreSQL instead of SQLite:
1. Install the appropriate database driver
2. Update database connection in `database.js`
3. Modify SQL queries if needed

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Reset
Delete the `cruise_programs.db` file to reset the database and recreate the default admin user.

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change the port in `server.js`: `const PORT = process.env.PORT || 3001;`

2. **File Upload Fails**
   - Check file permissions on `uploads/` directory
   - Ensure file type is supported
   - Verify file size is reasonable

3. **Database Errors**
   - Delete `cruise_programs.db` to reset
   - Check file permissions
   - Ensure SQLite is properly installed

### Logs
Check the console output for detailed error messages and debugging information.

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please check the troubleshooting section or create an issue in the project repository. 