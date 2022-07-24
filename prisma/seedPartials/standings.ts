import "dotenv/config";
import axios from "axios";

import { prisma } from "../../src/server/db/client";
import { apiFootballConfig } from "../seed";

async function getStandings(league: number, season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/standings?league=${league}&season=${season}`,
      apiFootballConfig
    );
    return data;
  } catch (err) {
    throw err;
  }
}

export const doBackfillStandings = async (
  apiFootballLeagueId: number,
  seasonYear: number
) => {
  const data = await getStandings(apiFootballLeagueId, seasonYear);
  const teams = await prisma.team.findMany();
  const league = await prisma.league.findFirst({
    where: { apiFootballId: apiFootballLeagueId },
  });
  const leagueId = league?.id;
  const season = await prisma.season.findFirst({
    where: { year: seasonYear, leagueId },
  });
  const seasonId = season?.id;
  const dbRecords = await prisma.standing.findMany({
    where: { seasonId, leagueId },
  });

  const standings = data.response[0]?.league.standings[0].map((x: any) => {
    const teamId = teams.find((t: any) => {
      return t.apiFootballId === x.team.id;
    })?.id;

    return {
      rank: x.rank,
      points: x.points,
      form: x.form,
      goalsDiff: x.goalsDiff,
      playedHome: x.home.played,
      winHome: x.home.win,
      drawHome: x.home.draw,
      loseHome: x.home.draw,
      goalsForHome: x.home.goals.for,
      goalsAgainstHome: x.home.goals.against,
      playedAway: x.away.played,
      winAway: x.away.win,
      drawAway: x.away.draw,
      loseAway: x.away.draw,
      goalsForAway: x.away.goals.for,
      goalsAgainstAway: x.away.goals.against,
      update: x.update,
      teamId,
      leagueId,
      seasonId,
    };
  });

  var newStandings = standings?.filter(
    (standing: any) =>
      !dbRecords.find(
        (dbRecord) =>
          dbRecord.seasonId === standing.seasonId &&
          dbRecord.leagueId === standing.leagueId
      )
  );

  if (newStandings?.length > 0) {
    const creation = await prisma.standing.createMany({ data: newStandings });
    console.log({ creation });
  } else {
    console.log("no standings created");
  }
};
