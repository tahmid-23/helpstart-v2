import { ExecutorStage } from './stage/executor-stage.js';

export interface ExecutionStep<T> {
  stage: ExecutorStage<T>;
  state: T;
}
