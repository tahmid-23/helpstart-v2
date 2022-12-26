import { BotTransaction } from '../bot/bot-repository.js';
import { HelpstartBot } from '../bot/bot.js';
import { HelpstartRequest } from './helpstart-request.js';

export interface HelpstartSession {
  readonly request: HelpstartRequest;
  readonly botTransaction: BotTransaction;
  readonly leader: HelpstartBot;
}
