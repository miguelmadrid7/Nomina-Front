import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { catchError, from, map, Observable, of } from "rxjs";

export function extractFilename(response: HttpResponse<Blob>): string | null {
  const disposition = response.headers.get('Content-Disposition');
  if (!disposition) return null;
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function extractBlobErrorMessage(err: HttpErrorResponse, fallback: string): Observable<string> {
  const body: unknown = err.error;
  if (!(body instanceof Blob)) {
    return of((body as { message?: string })?.message ?? fallback);
  }
  return from(body.text()).pipe(
    map((text) => {
      try {
        return JSON.parse(text)?.message ?? fallback;
      } catch {
        return fallback;
      }
    }),
    catchError(() => of(fallback))
  );
}