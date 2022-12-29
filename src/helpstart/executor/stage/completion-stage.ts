import { HelpstartSession } from '../../helpstart-session.js';
import { ExecutorStage } from './executor-stage.js';
import { StageKey } from './stage-key.js';

export interface CompletionState {
  updatesSinceStart: number;
}

export function createDefaultCompletionState(): CompletionState {
  return {
    updatesSinceStart: 0
  };
}

export class CompletionStage implements ExecutorStage<CompletionState> {
  start(session: HelpstartSession): void {
    if (session.request.players.length === 1) {
      if (session.leader.connected) {
        session.leader.chat('/party disband');
      }
    } else if (session.request.players.length > 1) {
      session.leader.chat(`/party transfer ${session.request.players[0]}`);
    }
    for (const bot of session.botTransaction.bots) {
      if (bot.connected) {
        bot.chat('/party leave');
        bot.chat('/lobby arcade');
      }
    }

    session.request.onComplete();
  }
  update(_session: HelpstartSession, state: CompletionState): void {
    ++state.updatesSinceStart;
    return;
  }
  end(): void {
    return;
  }
  getResult(): StageKey | undefined {
    return undefined;
  }
  shouldTerminate(_session: HelpstartSession, state: CompletionState): boolean {
    return state.updatesSinceStart === 10;
  }
}
