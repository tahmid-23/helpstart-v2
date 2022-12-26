import { Database } from 'sqlite';
import { HelpstartDatabase } from '../helpstart-database.js';

type EmailRow = {
  email: string;
};

type IGNRow = {
  ign: string;
};

export abstract class SqliteDatabase implements HelpstartDatabase {
  private connection?: Database;

  protected abstract connect(): Promise<Database>;

  async queryBotAccounts(): Promise<string[]> {
    if (!this.connection) {
      this.connection = await this.connect();
    }

    const rows = await this.connection.all<EmailRow[]>(
      'SELECT email FROM bot_account'
    );
    const emails = rows.map((row) => row.email);
    return emails;
  }

  async addUserAccount(userId: string, ign: string): Promise<void> {
    if (!this.connection) {
      this.connection = await this.connect();
    }

    await this.connection.run(
      'INSERT INTO user_account (user_id, ign) VALUES(?, ?)',
      userId,
      ign
    );
  }

  async queryUserAccounts(userId: string): Promise<string[]> {
    if (!this.connection) {
      this.connection = await this.connect();
    }

    const rows = await this.connection.all<IGNRow[]>(
      'SELECT ign FROM user_account WHERE user_id = ?',
      userId
    );
    const igns = rows.map((row) => row.ign);
    return igns;
  }

  async deleteAllUserAccounts(userId: string): Promise<number | undefined> {
    if (!this.connection) {
      this.connection = await this.connect();
    }

    const result = await this.connection.run(
      'DELETE FROM user_account WHERE user_id = ?',
      userId
    );
    return result.changes;
  }
}
