import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from '../models/api.models';

const words = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();

/** "VAL.MobileNumber.Invalid" -> "Mobile number is invalid"; plain messages pass through. */
function readable(field: string, message: string): string {
  const code = /^VAL\.([A-Za-z0-9]+)\.([A-Za-z0-9]+)$/.exec(message);
  if (code) {
    const subject = words(code[1]).toLowerCase();
    const rule = words(code[2]).toLowerCase();
    const sentence = rule === 'required' ? `${subject} is required` : rule === 'invalid' ? `${subject} is invalid` : `${subject}: ${rule}`;
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  }
  return message.includes(' ') ? message : `${words(field)}: ${message}`;
}

/** Turns an HTTP failure (ProblemDetails, validation errors or a network error) into one readable message. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'Cannot reach the server. Make sure the API services are running.';
  }
  const problem = error.error as ProblemDetails | null;
  if (error.status === 401 && !problem?.detail) {
    return 'Please log in to continue.';
  }
  if (error.status === 403 && !problem?.detail) {
    return 'You do not have permission to do this.';
  }
  if (problem?.errors) {
    const messages = Object.entries(problem.errors).flatMap(([field, list]) => list.map(m => readable(field, m)));
    if (messages.length) {
      return messages.join(' ');
    }
  }
  return problem?.detail || problem?.title || fallback;
}
