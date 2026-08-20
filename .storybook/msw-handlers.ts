import type { RequestHandler } from "msw";

// Feature stories talk to Server Actions, not REST. Empty until a story
// actually hits an HTTP endpoint during render.
export const mswHandlers: RequestHandler[] = [];
