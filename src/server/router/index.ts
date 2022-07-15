// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { footballRouter } from "./football";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("football.", footballRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
