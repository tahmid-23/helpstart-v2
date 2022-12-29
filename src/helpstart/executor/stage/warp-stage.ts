import { HelpstartBotEvents, Message } from '../../../bot/bot.js';
import { getMapMinigameName } from '../../../zombies/game-map.js';
import { HelpstartSession } from '../../helpstart-session.js';
import { ExecutorStage, runGenericCompletionChecks } from './executor-stage.js';
import { StageKey, START_KEY } from './stage-key.js';
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

export class WarpStage implements ExecutorStage<WarpState> {
  start(session: HelpstartSession, state: WarpState): void {
    session.leader.chat('/lobby arcade');

    const listener = (message: Message) => state.messageQueue.push(message);
    session.leader.on('chat', listener);
    state.listener = listener;
  }
  update(session: HelpstartSession, state: WarpState): void {
    for (const message of state.messageQueue) {
      if (!runGenericCompletionChecks(session, state, message)) {
        return;
      }
    }
    state.messageQueue.splice(0, state.messageQueue.length);

    if (state.updatesSinceStart === 5) {
      session.leader.chat('/party warp');
      session.leader.chat('/party warp');
    }
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
