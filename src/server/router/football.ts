import { prisma } from "../db/client";
// import { z } from "zod";

import { createRouter } from "./context";

export const footballRouter = createRouter().query("get-teams", {
  async resolve() {
    const teams = await prisma.team.findMany();

    return teams;
  },
});
