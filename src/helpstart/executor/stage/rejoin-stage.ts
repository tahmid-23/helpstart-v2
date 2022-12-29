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

export class RejoinStage implements ExecutorStage<RejoinState> {
  start(session: HelpstartSession): void {
    session.leader.chat(
      "A bot rejoined somebody else's game, please wait until I rewarp..."
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
