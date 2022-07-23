import { prisma } from "../db/client";
import { z } from "zod";

import { createRouter } from "./context";

export const footballRouter = createRouter()
  .query("get-teams", {
    async resolve() {
      const teams = await prisma.team.findMany();

      return teams;
    },
  })
  .query("get-standings", {
    input: z.object({
      league: z.number({
        required_error: "League id is required",
        invalid_type_error: "League id must be a number",
      }),
      season: z
        .number({
          required_error: "Season is required",
          invalid_type_error: "Season must be a number",
        })
        .min(1990),
    }),
    async resolve(req) {
      const standings = await prisma.standing.findMany({
        where: {
          season: {
            year: req.input.season,
            AND: [{ league: { apiFootballId: req.input.league } }],
          },
        },
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
            played:
              s.playedHome && s.playedAway ? s.playedHome + s.playedAway : 0,
            win: s.winHome && s.winAway ? s.winHome + s.winAway : 0,
            draw: s.drawHome && s.drawAway ? s.drawHome + s.drawAway : 0,
            lose: s.loseHome && s.loseAway ? s.loseHome + s.loseAway : 0,
            goals: {
              for:
                s.goalsForHome && s.goalsForAway
                  ? s.goalsForHome + s.goalsForAway
                  : 0,
              against:
                s.goalsAgainstHome && s.goalsAgainstAway
                  ? s.goalsAgainstHome + s.goalsAgainstAway
                  : 0,
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
          form: s.form,
          goalsDiff: s.goalsDiff,
          update: s.update,
        };
      });

      return formattedStandings;
    },
  })
  .query("get-seasons", {
    input: z.number({
      required_error: "League id is required",
      invalid_type_error: "League id must be a number",
    }),
    async resolve(req) {
      const seasons = await prisma.season.findMany({
        where: {
          league: { apiFootballId: req.input },
          Standing: {
            some: {},
          },
        },
        orderBy: [{ year: "asc" }],
      });

      return seasons;
    },
  });
