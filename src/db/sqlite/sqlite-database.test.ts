import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { SqliteDatabase } from './sqlite-database.js';
import { HelpstartDatabase } from '../helpstart-database.js';

let connection: Database;
let database: HelpstartDatabase;

beforeEach(async () => {
  connection = await open({
    filename: ':memory:',
    driver: sqlite3.Database
  });
  await Promise.all([
    connection.exec('CREATE TABLE bot_account (email TEXT PRIMARY KEY)'),
    connection.exec(
      'CREATE TABLE user_account (user_id TEXT, ign TEXT, PRIMARY KEY(user_id, ign))'
    )
  ]);
  database = new SqliteDatabase(connection);
});

const USER_ID = '1234';
const IGN_1 = 'ign1';
const IGN_2 = 'ign2';

test('Initially no user IGNs', async () => {
  const igns = await database.queryUserAccounts(USER_ID);
  expect(igns.length).toBe(0);
});

test('User IGNs persist', async () => {
  await Promise.all([
    database.addUserAccount(USER_ID, IGN_1),
    database.addUserAccount(USER_ID, IGN_2)
  ]);

  const igns = await database.queryUserAccounts(USER_ID);
  expect(igns.includes(IGN_1)).toBe(true);
  expect(igns.includes(IGN_2)).toBe(true);
});

test('User IGNs are removed after deletion', async () => {
  await Promise.all([
    database.addUserAccount(USER_ID, IGN_1),
    database.addUserAccount(USER_ID, IGN_2)
  ]);

  await database.deleteAllUserAccounts(USER_ID);

  const igns = await database.queryUserAccounts(USER_ID);
  expect(igns.length).toBe(0);
});

afterEach(async () => {
  await connection.close();
});
