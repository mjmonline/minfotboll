import "dotenv/config";
import axios from "axios";

import { prisma } from "../../src/server/db/client";
import { apiFootballConfig } from "../seed";

async function getFixtures(league: number, season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/fixtures?league=${league}&season=${season}`,
      apiFootballConfig
    );
    return data;
  } catch (err) {
    throw err;
  }
}

export const doBackfillFixtures = async (
  apiFootballLeagueId: number,
  seasonYear: number
) => {
  const data = await getFixtures(apiFootballLeagueId, seasonYear);
  const venues = await prisma.venue.findMany();
  const teams = await prisma.team.findMany();
  const league = await prisma.league.findFirst({
    where: { apiFootballId: apiFootballLeagueId },
  });
  const leagueId = league?.id;
  const season = await prisma.season.findFirst({
    where: { year: seasonYear, leagueId },
  });
  const seasonId = season?.id;
  const dbRecords = await prisma.fixture.findMany({
    where: { seasonId, leagueId },
  });

  const fixtures = data.response.map((x: any, i: number) => {
    const venueId = venues.find(
      (v: any) => v.apiFootballId === x.fixture.venue.id
    )?.id;
    const homeTeamId = teams.find(
      (th: any) => th.apiFootballId === x.teams.home.id
    )?.id;
    const awayTeamId = teams.find(
      (ta: any) => ta.apiFootballId === x.teams.away.id
    )?.id;

    return {
      apiFootballId: x.fixture.id,
      referee: x.fixture.referee,
      timezone: x.fixture.timezone,
      timestamp: x.fixture.timestamp,
      firstPeriod: x.fixture.periods.first,
      secondPeriod: x.fixture.periods.second,
      venueId,
      statusLong: x.fixture.status.long,
      statusShort: x.fixture.status.short,
      elapsedTime: x.fixture.status.elapsed,
      leagueId,
      seasonId,
      homeTeamId,
      awayTeamId,
      goalsHome: x.goals.home,
      goalsAway: x.goals.away,
      scoreHalfTimeHome: x.score.halftime.home,
      scoreHalfTimeAway: x.score.halftime.away,
      scoreFullTimeHome: x.score.fulltime.home,
      scoreFullTimeAway: x.score.fulltime.away,
      scoreExtraTimeHome: x.score.extratime.home,
      scoreExtraTimeAway: x.score.extratime.away,
      scorePenaltyHome: x.score.penalty.home,
      scorePenaltyAway: x.score.penalty.away,
    };
  });

  var newFixtures = fixtures.filter(
    (fixture: any) =>
      !dbRecords.find(
        (dbRecord) => dbRecord.apiFootballId === fixture.apiFootballId
      )
  );

  if (newFixtures.length > 0) {
    const creation = await prisma.fixture.createMany({ data: newFixtures });
    console.log({ creation });
  } else {
    console.log("no fixtures created");
  }
};
