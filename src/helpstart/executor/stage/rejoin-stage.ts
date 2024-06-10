import { HelpstartSession } from '../../helpstart-session.js';
import { ExecutorStage } from './executor-stage.js';
import { StageKey, WARP_KEY } from './stage-key.js';

export interface RejoinState {
  updatesSinceStart: number;
  result?: StageKey;
}

export function createDefaultRejoinState(): RejoinState {
  return {
    updatesSinceStart: 0
  };
}

const REJOIN_MESSAGES = [
  "one of your fellow players rejoined someone else's game. that's bad.",
  'I feel like rewarping for some reason',
  'im not in ur game??? i guess ill rewarp',
  'hypixel trolled, rewarp time',
  'wait let me test the rewarp command',
  'you probably know what went wrong',
  "SOMETHING rejoined somebody else's game, please wait until I rewarp...",
  'using timer is cheat. thats why I warped you into wrong game.',
  'sorry, can I spectate someone first? no? ok...',
  'did you know about /play arcade_zombies_bad_blood ? let me show you'
];

export class RejoinStage implements ExecutorStage<RejoinState> {
  start(session: HelpstartSession): void {
    session.leader.chat(
      REJOIN_MESSAGES[Math.floor(Math.random() * REJOIN_MESSAGES.length)]
    );
  }
  update(session: HelpstartSession, state: RejoinState): void {
    // 6 seconds
    if (state.updatesSinceStart === 60) {
      state.result = WARP_KEY;
      return;
    }
    ++state.updatesSinceStart;
  }
  end(): void {
    // no end code
  }
  getResult(
    _session: HelpstartSession,
    state: RejoinState
  ): string | undefined {
    return state.result;
  }
  shouldTerminate(): boolean {
    return false;
  }
}
