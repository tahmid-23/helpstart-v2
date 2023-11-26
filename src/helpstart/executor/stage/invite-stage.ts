import { HelpstartBotEvents, Message } from '../../../bot/bot.js';
import { tryFollowUp } from '../../../util/discord/try-follow-up.js';
import { HelpstartSession } from '../../helpstart-session.js';
import { ExecutorStage, runGenericCompletionChecks } from './executor-stage.js';
import { COMPLETION_KEY, StageKey, WARP_KEY } from './stage-key.js';
import { StateWithResult } from './state-with-result.js';

export interface InviteState extends StateWithResult {
  readonly requiredCount: number;
  numberAccepted: number;
  readonly messageQueues: Message[][];
  listeners?: HelpstartBotEvents['chat'][];
  readonly leaderQueue: Message[];
  leaderListener?: HelpstartBotEvents['chat'];
  result?: StageKey;
}

export function createDefaultInviteState(
  session: HelpstartSession
): InviteState {
  return {
    requiredCount: 4,
    numberAccepted: 0,
    messageQueues: Array.from({
      length: session.botTransaction.bots.length
    }).map(() => []),
    leaderQueue: []
  };
}

const INVITE =
  /^-----------------------------------------------------\n(?:.* )?(.+) has invited you to join their party!\nYou have 60 seconds to accept\. Click here to join!\n-----------------------------------------------------$/;
const JOIN_PARTY = /^(?:.+) joined the party\.$/;
const INVITE_IGNORED =
  /^You cannot invite that player since they have ignored you\.$/;
const INVITE_UNABLE = /^You cannot invite that player\.$/;
const INVITE_UNKNOWN = /^Couldn't find a player with that name!$/;
const INVITE_OFFLINE =
  /^You cannot invite that player since they're not online\.$/;
const INVITE_EXPIRED = /^The party invite to .+ has expired\.$/;

export class InviteStage implements ExecutorStage<InviteState> {
  start(session: HelpstartSession, state: InviteState): void {
    for (const player of session.request.players) {
      session.leader.chat(`/party invite ${player}`);
    }
    for (const bot of session.botTransaction.bots) {
      if (bot.username === session.leader.username) {
        continue;
      }
      session.leader.chat(`/party invite ${bot.username}`);
    }
    session.leader.chat('/chat party');

    const listeners = [];
    for (let i = 0; i < session.botTransaction.bots.length; ++i) {
      const listener = (message: Message) => {
        state.messageQueues[i].push(message);
      };
      session.botTransaction.bots[i].on('chat', listener);
      listeners.push(listener);
    }
    state.listeners = listeners;

    const leaderListener = (message: Message) => {
      state.leaderQueue.push(message);
    };
    session.leader.on('chat', leaderListener);
    state.leaderListener = leaderListener;
  }
  update(session: HelpstartSession, state: InviteState): void {
    const totalInvites =
      session.request.players.length + session.botTransaction.bots.length - 1;
    if (state.numberAccepted === totalInvites) {
      state.result = WARP_KEY;
      return;
    }

    for (let i = 0; i < state.messageQueues.length; ++i) {
      const queue = state.messageQueues[i];
      const bot = session.botTransaction.bots[i];
      for (const message of queue) {
        if (bot.username !== session.leader.username) {
          const matches = message.plainText.match(INVITE);
          if (!matches || matches[1] !== session.leader.username) {
            continue;
          }

          bot.chat(`/party join ${session.leader.username}`);
        }
      }

      queue.splice(0, queue.length);
    }
    for (const message of state.leaderQueue) {
      if (JOIN_PARTY.test(message.plainText)) {
        ++state.numberAccepted;
        continue;
      }

      if (!runGenericCompletionChecks(session, state, message)) {
        return;
      }
      if (INVITE_IGNORED.test(message.plainText)) {
        tryFollowUp(
          session.request.interaction,
          `${session.request.interaction.user}, failed to helpstart because one of the players has a bot ignored.`
        );
        state.result = COMPLETION_KEY;
        return;
      }
      if (INVITE_UNABLE.test(message.plainText)) {
        tryFollowUp(
          session.request.interaction,
          `${session.request.interaction.user}, failed to helpstart because one of the players could not be invited.`
        );
        state.result = COMPLETION_KEY;
        return;
      }
      if (INVITE_UNKNOWN.test(message.plainText)) {
        tryFollowUp(
          session.request.interaction,
          `${session.request.interaction.user}, failed to helpstart because one of the players could not be invited.`
        );
        state.result = COMPLETION_KEY;
        return;
      }
      if (INVITE_OFFLINE.test(message.plainText)) {
        tryFollowUp(
          session.request.interaction,
          `${session.request.interaction.user}, failed to helpstart because a player was offline.`
        );
        state.result = COMPLETION_KEY;
        return;
      }
      if (INVITE_EXPIRED.test(message.plainText)) {
        tryFollowUp(
          session.request.interaction,
          `${session.request.interaction.user}, failed to helpstart because an invite expired.`
        );
        state.result = COMPLETION_KEY;
        return;
      }
    }

    state.leaderQueue.splice(0, state.leaderQueue.length);
    return;
  }
  end(session: HelpstartSession, state: InviteState): void {
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
    state: InviteState
  ): StageKey | undefined {
    return state.result;
  }
  shouldTerminate(): boolean {
    return false;
  }
}
