import { Database } from 'sqlite';
import { HelpstartDatabase } from '../helpstart-database.js';

type EmailRow = {
  email: string;
};

type IGNRow = {
  ign: string;
};

export class SqliteDatabase implements HelpstartDatabase {
  private readonly connection: Database;

  constructor(connection: Database) {
    this.connection = connection;
  }

  async queryBotAccounts(): Promise<string[]> {
    const rows = await this.connection.all<EmailRow[]>(
      'SELECT email FROM bot_account'
    );
    const emails = rows.map((row) => row.email);
    return emails;
  }

  async addUserAccount(userId: string, ign: string): Promise<void> {
    await this.connection.run(
      'INSERT INTO user_account (user_id, ign) VALUES(?, ?)',
      userId,
      ign
    );
  }

  async queryUserAccounts(userId: string): Promise<string[]> {
    const rows = await this.connection.all<IGNRow[]>(
      'SELECT ign FROM user_account WHERE user_id = ?',
      userId
    );
    const igns = rows.map((row) => row.ign);
    return igns;
  }

  async deleteAllUserAccounts(userId: string): Promise<number | undefined> {
    const result = await this.connection.run(
      'DELETE FROM user_account WHERE user_id = ?',
      userId
    );
    return result.changes;
  }
}
