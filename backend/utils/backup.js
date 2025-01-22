const { exec } = require('child_process');
const path = require('path');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);

      // Ensure backup directory exists
      await this.ensureDirExists(this.backupDir);

      // Construct the pg_dump command
      const pgDumpCommand = `pg_dump -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -d ${process.env.DB_NAME} -f ${backupFile}`;

      // Execute the pg_dump command
      await this.executeCommand(pgDumpCommand);

      console.log(`Database backup created successfully: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('Error creating database backup:', error);
      throw error;
    }
  }

  async ensureDirExists(dirPath) {
    return new Promise((resolve, reject) => {
      exec(`mkdir -p ${dirPath}`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout ? stdout : stderr);
        }
      });
    });
  }
}

module.exports = new BackupService();