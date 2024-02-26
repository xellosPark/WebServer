const sqlite3 = require('sqlite3').verbose();

let db;

function connectDatabase() {
    if (!db) {
        db = new sqlite3.Database('./DB/ubisamdb.db', sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
                throw err;
            }
            console.log('Connected to the SQLite database.');
        });
    }
    return db;
}

module.exports = connectDatabase();