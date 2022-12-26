import { tryFollowUp } from '../../util/try-follow-up.js';
import { HelpstartSession } from '../helpstart-session.js';
import { ExecutionStep } from './execution-step.js';
import { ExecutorStage } from './stage/executor-stage.js';
import { StageKey } from './stage/stage-key.js';

export interface HelpstartExecutor {
  update(): void;
  execute(session: HelpstartSession): void;
  getSessions(): readonly HelpstartSession[];
}

interface PendingExecution {
  readonly session: HelpstartSession;
  step: ExecutionStep<unknown>;
}

export type StateGenerator<T> = (session: HelpstartSession) => T;

export class BasicHelpstartExecutor implements HelpstartExecutor {
  private readonly ongoing: PendingExecution[] = [];
  private readonly stages: Record<
    StageKey,
    [ExecutorStage<unknown>, StateGenerator<unknown>]
  >;
  private readonly initialStage: ExecutorStage<unknown>;
  private readonly initalStateGenerator: StateGenerator<unknown>;
  private readonly completionStage: ExecutorStage<unknown>;
  private readonly completionStateGenerator: StateGenerator<unknown>;

  constructor(
    stages: Record<StageKey, [ExecutorStage<unknown>, StateGenerator<unknown>]>,
    initialStage: ExecutorStage<unknown>,
    initialStateGenerator: StateGenerator<unknown>,
    completionStage: ExecutorStage<unknown>,
    completionStateGenerator: () => unknown
  ) {
    this.stages = stages;
    this.initialStage = initialStage;
    this.initalStateGenerator = initialStateGenerator;
    this.completionStage = completionStage;
    this.completionStateGenerator = completionStateGenerator;
  }

  private terminate(execution: PendingExecution) {
    execution.step.stage.end(execution.session, execution.step.state);
    execution.session.botTransaction.end();
  }

  private clearTerminated(): void {
    for (let i = this.ongoing.length - 1; i >= 0; --i) {
      const execution = this.ongoing[i];
      if (
        execution.step.stage.shouldTerminate(
          execution.session,
          execution.step.state
        ) ||
        execution.session.botTransaction.bots.some((bot) => !bot.connected)
      ) {
        this.terminate(execution);
        this.ongoing.splice(i, 1);
      }
    }
  }

  private updateOngoing(): void {
    for (let i = 0; i < this.ongoing.length; ++i) {
      const execution = this.ongoing[i];
      const someDisconnected = execution.session.botTransaction.bots.some(
        (bot) => !bot.connected
      );
      if (someDisconnected) {
        this.ongoing[i] = {
          session: execution.session,
          step: {
            stage: this.completionStage,
            state: this.completionStateGenerator(execution.session)
          }
        };
        continue;
      }

      execution.step.stage.update(execution.session, execution.step.state);
      const nextStageKey = execution.step.stage.getResult(
        execution.session,
        execution.step.state
      );
      if (nextStageKey) {
        execution.step.stage.end(execution.session, execution.step.state);
        const [stage, stateGenerator] = this.stages[nextStageKey];
        execution.step = {
          stage: stage,
          state: stateGenerator(execution.session)
        };
        execution.step.stage.start(execution.session, execution.step.state);
      }
    }
  }

  update(): void {
    this.clearTerminated();
    this.updateOngoing();
  }

  execute(session: HelpstartSession): void {
    const state = this.initalStateGenerator(session);
    this.initialStage.start(session, state);
    this.ongoing.push({
      session: session,
      step: {
        stage: this.initialStage,
        state: state
      }
    });

    const message = `${session.request.interaction.user}, ${session.leader.username} will invite you to the party.`;
    tryFollowUp(session.request.interaction, message);
  }

  getSessions(): readonly HelpstartSession[] {
    return this.ongoing.map((exeuction) => exeuction.session);
  }
}
