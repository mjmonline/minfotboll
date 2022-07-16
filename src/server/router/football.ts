import { prisma } from "../db/client";
// import { z } from "zod";

import { createRouter } from "./context";

export const footballRouter = createRouter()
  .query("get-teams", {
    async resolve() {
      const teams = await prisma.team.findMany();

      return teams;
    },
  })
  .query("get-standings", {
    input: (val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error(`Invalid input: ${typeof val}`);
    },
    async resolve(req) {
      const standings = await prisma.standing.findMany({
        where: { season: req.input },
        orderBy: [{ rank: "asc" }],
      });
      const teams = await prisma.team.findMany();

      const formattedStandings = standings.map((s) => {
        const team = teams.find((t) => t.id === s.teamId);
        return {
          rank: s.rank,
          team: {
            id: team?.id,
            name: team?.name,
            logo: team?.logo,
          },
          all: {
            played: s.playedHome + s.playedAway,
            win: s.winHome + s.winAway,
            draw: s.drawHome + s.drawAway,
            lose: s.loseHome + s.loseAway,
            goals: {
              for: s.goalsForHome + s.goalsForAway,
              against: s.goalsAgainstHome + s.goalsAgainstAway,
            },
          },
          home: {
            played: s.playedHome,
            win: s.winHome,
            draw: s.drawHome,
            lose: s.loseHome,
            goals: {
              for: s.goalsForHome,
              against: s.goalsAgainstHome,
            },
          },
          away: {
            played: s.playedAway,
            win: s.winAway,
            draw: s.drawAway,
            lose: s.loseAway,
            goals: {
              for: s.goalsForAway,
              against: s.goalsAgainstAway,
            },
          },
          points: s.points,
          goalsDiff: s.goalsDiff,
          update: s.update,
        };
      });

      return formattedStandings;
    },
  });
