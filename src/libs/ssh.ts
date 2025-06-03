import { Client } from 'ssh2';

type SshClientOptions = {
  host: string;
  port: number;
  username: string;
  password: string;
  readyCallback: () => void;
};

class SshClient {
  private readonly client: Client;
  private readonly readyCallback: () => void;

  constructor(private readonly config: SshClientOptions) {
    this.client = new Client();
    this.client.connect({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
    });
    this.readyCallback = config.readyCallback;
    this.setupListeners();
  }

  private setupListeners() {
    this.client.on('ready', () => {
      this.readyCallback?.();
    });
  }
}
