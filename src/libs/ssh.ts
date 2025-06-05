import { Client, type ConnectConfig } from 'ssh2';
import Logger from '../utils/logger';

class SSHClient {
  private readonly client: Client;

  constructor() {
    this.client = new Client();
  }

  private parseConnectionString(connectionString: string): ConnectConfig {
    const match = connectionString.match(/^ssh\s+([^@]+)@([^\s]+)\s+-p\s+([^\s]+)(?:\s+-port\s+(\d+))?$/);
    if (!match) throw new Error('Invalid SSH connection string format. Expected: ssh user@ip:port -p password -port port');
    const [, username, host, password, port = '22'] = match;
    return {
      username,
      password,
      host,
      port: parseInt(port, 10),
    };
  }

  async connect(connection: string | ConnectConfig): Promise<string> {
    if (typeof connection === 'string') {
      connection = this.parseConnectionString(connection);
    }

    const { host, port = 22, username = 'root', password } = connection;

    return new Promise((resolve, reject) => {
      this.client
        .on('ready', () => {
          Logger.info(`Connected to ${host}:${port} as ${username}`);
          resolve(`Connected to ${host}:${port} as ${username}`);
        })
        .on('error', err => {
          Logger.error(`Failed to connect to ${host}:${port} as ${username}, error: ${err.message}`);
          reject(`Failed to connect to ${host}:${port} as ${username}, error: ${err.message}`);
        })
        .connect({ host, port, username, password });
    });
  }

  disconnect() {
    this.client.end();
    Logger.info('Disconnected from SSH server');
  }

  async exec(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      this.client.exec(command, (err, stream) => {
        if (err) reject(err);

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code: any, signal: any) => {
            Logger.info(`Command ${command} executed with code ${code} - ${signal}`);
            if (code != 0) {
              return reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
            resolve({ stdout, stderr });
          })
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });
  }
}

export default SSHClient;
