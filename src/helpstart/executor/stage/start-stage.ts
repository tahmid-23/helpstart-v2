import { HelpstartBotEvents, Message } from '../../../bot/bot.js';
import { PriorityQueue } from '../../../util/priority-queue.js';
import { tryFollowUp } from '../../../util/discord/try-follow-up.js';
import { getChestDisplayName } from '../../../zombies/game-chest.js';
import { GameMap } from '../../../zombies/game-map.js';
import { ChestMode, HelpstartRequest } from '../../helpstart-request.js';
import { HelpstartSession } from '../../helpstart-session.js';
import { ExecutorStage, runGenericCompletionChecks } from './executor-stage.js';
import { StageKey, COMPLETION_KEY, WARP_KEY, REJOIN_KEY } from './stage-key.js';
import { StateWithResult } from './state-with-result.js';

export interface StartState extends StateWithResult {
  failedAttempts: number;
  readonly messageQueues: Message[][];
  listeners?: HelpstartBotEvents['chat'][];
  readonly leaderQueue: Message[];
  leaderListener?: HelpstartBotEvents['chat'];
  result?: StageKey;
}

export function createDefaultStartState(session: HelpstartSession): StartState {
  return {
    failedAttempts: 0,
    messageQueues: Array.from({
      length: session.botTransaction.bots.length
    }).map(() => []),
    leaderQueue: []
  };
}

const SELF_REJOIN = /^To leave Zombies, type \/lobby$/;
const OTHER_REJOIN = /^.+ rejoined.$/;
const GAME_JOIN =
  /^You joined as the party leader! Use the Party Options Menu to change game settings\.$/;
const PLAYER_QUIT = /^(.+) has quit!$/;
const GAME_START = /^\s*Zombies\s*$/;
const CHECK_CHEST =
  /^This Lucky Chest is not active right now! Find the active Lucky Chest in the (.+)!$/;

export class StartStage implements ExecutorStage<StartState> {
  private readonly requests: PriorityQueue<HelpstartRequest>;

  private readonly maxFailedAttempts: number;

  constructor(
    requests: PriorityQueue<HelpstartRequest>,
    maxFailedAttempts: number
  ) {
    this.requests = requests;
    this.maxFailedAttempts = maxFailedAttempts;
  }

  start(session: HelpstartSession, state: StartState): void {
    const listeners = [];
    for (let i = 0; i < session.botTransaction.bots.length; ++i) {
      const listener = (message: Message) => {
        state.messageQueues[i].push(message);
      };
      session.botTransaction.bots[i].on('chat', listener);
      listeners.push(listener);
    }
    state.listeners = listeners;

    const leaderListener = (message: Message) =>
      state.leaderQueue.push(message);
    session.leader.on('chat', leaderListener);
    state.leaderListener = leaderListener;
  }
  update(session: HelpstartSession, state: StartState): void {
    for (let i = 0; i < state.messageQueues.length; ++i) {
      const queue = state.messageQueues[i];
      for (const message of queue) {
        if (
          SELF_REJOIN.test(message.plainText) ||
          OTHER_REJOIN.test(message.plainText)
        ) {
          state.result = REJOIN_KEY;
          return;
        }
      }

      queue.splice(0, queue.length);
    }

    for (const message of state.leaderQueue) {
      if (!runGenericCompletionChecks(session, state, message)) {
        return;
      }
      if (PLAYER_QUIT.test(message.plainText)) {
        tryFollowUp(
          session.request.interaction,
          `${session.request.interaction.user}, failed to helpstart because someone quit the game.`
        );
        state.result = COMPLETION_KEY;
        return;
      }

      if (GAME_JOIN.test(message.plainText)) {
        session.leader.chat('/party warp');
        session.leader.chat('/party warp');
        session.leader.setDifficulty(session.request.difficulty);
        continue;
      }

      const map = session.request.map;
      if (GAME_START.test(message.plainText)) {
        if (
          map === GameMap.AA ||
          session.request.chestMode === ChestMode.NONE
        ) {
          state.result = COMPLETION_KEY;
          return;
        } else {
          session.leader.checkChest(map);
        }
        continue;
      }

      const chestMatches = message.plainText.match(CHECK_CHEST);
      if (!chestMatches || chestMatches.length !== 2) {
        continue;
      }

      const chestName = chestMatches[1].toLowerCase();
      const currentChest = session.request.chests.find(
        (chest) => getChestDisplayName(chest).toLowerCase() === chestName
      );

      const wantsMatchingChest =
        session.request.chestMode === ChestMode.WHITELIST;
      const hasMatchingChest = currentChest !== undefined;

      if (wantsMatchingChest === hasMatchingChest) {
        state.result = COMPLETION_KEY;
      } else if (
        !this.requests.isEmpty() &&
        ++state.failedAttempts === this.maxFailedAttempts
      ) {
        session.leader.chat(
          'There are other people waiting in the queue, please try again.'
        );
        tryFollowUp(
          session.request.interaction,
          `${session.request.interaction.user}, there are other people waiting in the queue, please try again.`
        );
        state.result = COMPLETION_KEY;
      } else {
        state.result = WARP_KEY;
      }

      return;
    }

    state.leaderQueue.splice(0, state.leaderQueue.length);
  }
  end(session: HelpstartSession, state: StartState): void {
    if (state.listeners) {
      for (let i = 0; i < state.listeners.length; ++i) {
        session.botTransaction.bots[i].removeListener(
          'chat',
          state.listeners[i]
        );
      }
    }

    if (state.leaderListener) {
      session.leader.removeListener('chat', state.leaderListener);
    }
  }
  getResult(
    _session: HelpstartSession,
    state: StartState
  ): StageKey | undefined {
    return state.result;
  }
  shouldTerminate(): boolean {
    return false;
  }
}
