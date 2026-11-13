export interface ProgressMessage {
    jobId: number;
    progress: number;
    status: string;
    errorMsg: string | null;
    errorType?: string;
    userMessage?: string | null;
    failedStepIndex: number | null;
    failedStepName: string | null;
    stepIndex?: number;
    stepName?: string;
    endTime?: string;
    durationMs?: number;
    totalDurationMs?: number;
}