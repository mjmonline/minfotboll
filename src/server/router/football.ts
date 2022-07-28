import { prisma } from "../db/client";
import { z } from "zod";

import { createRouter } from "./context";

function getWinner(goalsHome: number | null, goalsAway: number | null) {
  if (goalsHome && goalsAway) {
    if (goalsHome > goalsAway) {
      return "home";
    } else {
      return "away";
    }
  }

  return null;
}

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
            league: { apiFootballId: req.input.league },
          },
        },
        orderBy: [{ rank: "asc" }],
      });
      const teams = await prisma.team.findMany({
        where: {
          season: { year: req.input.season },
          league: { apiFootballId: req.input.league },
        },
      });

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
        orderBy: [{ year: "desc" }],
      });

      return seasons;
    },
  })
  .query("get-leagues", {
    async resolve() {
      const seasons = await prisma.league.findMany({
        where: {
          Standing: {
            some: {},
          },
        },
        orderBy: [{ name: "asc" }],
      });

      return seasons;
    },
  })
  .query("get-fixtures", {
    input: z.object({
      league: z
        .number({
          invalid_type_error: "League id must be a number",
        })
        .optional(),
      season: z.number({
        required_error: "Season year is required",
        invalid_type_error: "Season year must be a number",
      }),
    }),
    async resolve(req) {
      console.dir(req.input);
      const fixtures = await prisma.fixture.findMany({
        where: {
          season: { year: req.input.season },
          league: { apiFootballId: req.input.league },
          // NOT: [{ statusShort: "FT" }],
        },
        orderBy: [{ timestamp: "asc" }],
      });
      const teamIds = fixtures.map((f) => [f.homeTeamId, f.awayTeamId]).flat();
      const venueIds = fixtures
        .map((f) => f.venueId)
        .filter(Number) as number[];
      const teams = await prisma.team.findMany({
        where: {
          id: { in: teamIds },
        },
      });
      const venues = await prisma.venue.findMany({
        where: {
          id: { in: venueIds! },
        },
      });

      const formattedFixtures = fixtures.map((f) => {
        const homeTeam = teams.find((t) => t.id === f.homeTeamId);
        const awayTeam = teams.find((t) => t.id === f.awayTeamId);
        const winner = getWinner(f.goalsHome, f.goalsAway);
        const venue = venues.find((v) => v.id === f.venueId);

        return {
          fixture: {
            id: f.id,
            referee: f.referee,
            timezone: f.timezone,
            timestamp: f.timestamp,
            periods: {
              first: f.firstPeriod,
              second: f.secondPeriod,
            },
            venue: {
              id: venue?.id,
              name: venue?.name,
              city: venue?.city,
            },
            status: {
              long: f.statusLong,
              short: f.statusShort,
              elapsed: f.elapsedTime,
            },
          },
          teams: {
            home: {
              id: homeTeam?.id,
              name: homeTeam?.name,
              logo: homeTeam?.logo,
              winner: winner === null ? null : winner === "home",
            },
            away: {
              id: awayTeam?.id,
              name: awayTeam?.name,
              logo: awayTeam?.logo,
              winner: winner === null ? null : winner === "away",
            },
          },
          goals: {
            home: f.goalsHome,
            away: f.goalsAway,
          },
          score: {
            halftime: {
              home: f.scoreHalfTimeHome,
              away: f.scoreHalfTimeAway,
            },
            fulltime: {
              home: f.scoreFullTimeHome,
              away: f.scoreFullTimeAway,
            },
            extratime: {
              home: f.scoreExtraTimeHome,
              away: f.scoreExtraTimeAway,
            },
            penalty: {
              home: f.scorePenaltyHome,
              away: f.scorePenaltyAway,
            },
          },
        };
      });

      return formattedFixtures;
    },
  });
