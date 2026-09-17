export interface LogFileResponse {
  date: string;
  type: string;
  lines: string[];
  lineCount: number;
  message: string;
}