import { StepExecution } from "./step-execution.model";

export interface PayRollJobState {
    readonly jobId: number | null;
    readonly progress: number;
    readonly processing: boolean;
    readonly deliverableReady: boolean;
    readonly totalDurationMs: number;
    readonly executionHistory: ReadonlyMap<number, StepExecution>;
    readonly failedStepIndex: number | null;
    readonly failedStepName: string | null;
    readonly errorMessage: string | null;
    readonly errorType: string | null;
    readonly userMessage: string | null;
}

export const INITIAL_PAYROLL_JOB_STATE: PayRollJobState = {
    jobId: null,
    progress: 0,
    processing: false,
    deliverableReady: false,
    totalDurationMs: 0,    
    executionHistory: new Map(),
    failedStepIndex: null,
    failedStepName: null,
    errorMessage: null,
    errorType: null, 
    userMessage: null,
}