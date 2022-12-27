export interface HelpstartDatabase {
  queryBotAccounts(): Promise<string[]>;
  addUserAccount(userId: string, name: string): Promise<void>;
  queryUserAccounts(userId: string): Promise<string[]>;
  deleteAllUserAccounts(userId: string): Promise<number | undefined>;
}