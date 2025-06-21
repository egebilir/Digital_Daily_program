const { db } = require('./database');

console.log('Cleaning database file paths...');

// Get all programs
db.all('SELECT * FROM daily_programs', (err, programs) => {
    if (err) {
        console.error('Error fetching programs:', err);
        return;
    }
    
    console.log(`Found ${programs.length} programs to clean`);
    
    programs.forEach(program => {
        console.log('Original file path:', JSON.stringify(program.file_path));
        
        // Clean the file path
        const cleanFilePath = program.file_path.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        
        console.log('Cleaned file path:', JSON.stringify(cleanFilePath));
        
        // Update the database
        db.run('UPDATE daily_programs SET file_path = ? WHERE id = ?', 
            [cleanFilePath, program.id], (err) => {
            if (err) {
                console.error('Error updating program', program.id, ':', err);
            } else {
                console.log('Updated program', program.id);
            }
        });
    });
    
    console.log('Database cleanup completed!');
}); 