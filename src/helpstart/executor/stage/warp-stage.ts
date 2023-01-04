import { HelpstartBotEvents, Message } from '../../../bot/bot.js';
import { tryFollowUp } from '../../../util/discord/try-follow-up.js';
import {
  getMapDisplayName,
  getMapMinigameName
} from '../../../zombies/game-map.js';
import { HelpstartSession } from '../../helpstart-session.js';
import { ExecutorStage, runGenericCompletionChecks } from './executor-stage.js';
import { COMPLETION_KEY, StageKey, START_KEY } from './stage-key.js';
import { StateWithResult } from './state-with-result.js';

export interface WarpState extends StateWithResult {
  updatesSinceStart: number;
  messageQueue: Message[];
  listener?: HelpstartBotEvents['chat'];
  result?: StageKey;
}

export function createDefaultWarpState(): WarpState {
  return {
    updatesSinceStart: 0,
    messageQueue: []
  };
}

const NOT_ENOUGH_SERVERS =
  /There are no servers that have enough room for a party right now! Try again in a moment! \(.+\)/;

export class WarpStage implements ExecutorStage<WarpState> {
  start(session: HelpstartSession, state: WarpState): void {
    const listener = (message: Message) => state.messageQueue.push(message);
    session.leader.on('chat', listener);
    state.listener = listener;
  }
  update(session: HelpstartSession, state: WarpState): void {
    for (const message of state.messageQueue) {
      if (!runGenericCompletionChecks(session, state, message)) {
        return;
      }

      if (NOT_ENOUGH_SERVERS.test(message.plainText)) {
        tryFollowUp(
          session.request.interaction,
          `${
            session.request.interaction.user
          }, failed to helpstart because not enough servers are avilable for ${getMapDisplayName(
            session.request.map
          )}.`
        );
        state.result = COMPLETION_KEY;
        return;
      }
    }
    state.messageQueue.splice(0, state.messageQueue.length);

    if (state.updatesSinceStart === 10) {
      session.leader.chat(`/play ${getMapMinigameName(session.request.map)}`);
      state.result = START_KEY;
      return;
    }
    ++state.updatesSinceStart;
  }
  end(session: HelpstartSession, state: WarpState): void {
    if (state.listener) {
      session.leader.removeListener('chat', state.listener);
    }
  }
  getResult(
    _session: HelpstartSession,
    state: WarpState
  ): StageKey | undefined {
    return state.result;
  }
  shouldTerminate(): boolean {
    return false;
  }
}
