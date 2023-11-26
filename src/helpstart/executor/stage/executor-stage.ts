import { Message } from '../../../bot/bot.js';
import { tryFollowUp } from '../../../util/discord/try-follow-up.js';
import {
  COMMAND_SPAM,
  KICKED_JOINING,
  PARTY_DISCONNECTED,
  PARTY_LEFT,
  SLOW_DOWN
} from '../../../zombies/hypixel-messages.js';
import { HelpstartSession } from '../../helpstart-session.js';
import { COMPLETION_KEY, StageKey } from './stage-key.js';
import { StateWithResult } from './state-with-result.js';

export interface ExecutorStage<T> {
  start(session: HelpstartSession, state: T): void;

  update(session: HelpstartSession, state: T): void;

  end(session: HelpstartSession, state: T): void;

  getResult(session: HelpstartSession, state: T): StageKey | undefined;

  shouldTerminate(session: HelpstartSession, state: T): boolean;
}

export function runGenericCompletionChecks(
  session: HelpstartSession,
  state: StateWithResult,
  message: Message
): boolean {
  if (
    SLOW_DOWN.test(message.plainText) ||
    COMMAND_SPAM.test(message.plainText)
  ) {
    tryFollowUp(
      session.request.interaction,
      `${session.request.interaction.user}, failed to helpstart because of Hypixel ratelimiting commands.`
    );
    state.result = COMPLETION_KEY;
    return false;
  }

  if (PARTY_DISCONNECTED.test(message.plainText)) {
    tryFollowUp(
      session.request.interaction,
      `${session.request.interaction.user}, failed to helpstart because someone disconnected.`
    );
    state.result = COMPLETION_KEY;
    return false;
  }

  if (PARTY_LEFT.test(message.plainText)) {
    tryFollowUp(
      session.request.interaction,
      `${session.request.interaction.user}, failed to helpstart because someone left the party.`
    );
    state.result = COMPLETION_KEY;
    return false;
  }
  if (KICKED_JOINING.test(message.plainText)) {
    tryFollowUp(
      session.request.interaction,
      `${session.request.interaction.user}, failed to helpstart due to being kicked while joining a game.`
    );
    state.result = COMPLETION_KEY;
    return false;
  }

  return true;
}
