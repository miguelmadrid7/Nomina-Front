export interface ProgressMessage {
    jobId: number;
    progress: number;
    status: string;
    errorMsg: string | null;
    failedStepIndex: number | null;
    failedStepName: string | null;
}