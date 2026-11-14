
const pool = require("./server/src/config/database");
async function testConnection() {
    try {
        const result = await pool.query(`
            SELECT
                current_database() AS database,
                current_user AS username,
                version() AS version; `);
        console.log("Connected to PostgreSQL!");
        console.table(result.rows);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}
testConnection();