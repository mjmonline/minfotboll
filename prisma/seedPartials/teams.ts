import "dotenv/config";
import axios from "axios";

import { prisma } from "../../src/server/db/client";
import { apiFootballConfig } from "../seed";

async function getTeams(league: number, season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/teams?league=${league}&season=${season}`,
      apiFootballConfig
    );
    return data;
  } catch (err) {
    throw err;
  }
}

export async function doBackfillTeams(
  apiFootballLeagueId: number,
  seasonYear: number
) {
  const data = await getTeams(apiFootballLeagueId, seasonYear);
  const venues = await prisma.venue.findMany();
  const league = await prisma.league.findFirst({
    where: { apiFootballId: apiFootballLeagueId },
  });
  const leagueId = league?.id;
  const season = await prisma.season.findFirst({
    where: { year: seasonYear, leagueId },
  });
  const seasonId = season?.id;
  const dbRecords = await prisma.team.findMany({
    where: { leagueId, seasonId },
  });

  const teams = data.response.map((t: any) => {
    const venueId = venues.find((v) => v.apiFootballId === t.venue.id)?.id;

    return {
      apiFootballId: Number(t.team.id),
      name: t.team.name,
      code: t.team.code,
      countryName: t.team.country,
      founded: t.team.founded.toString(),
      national: t.team.national,
      logo: t.team.logo,
      leagueId,
      venueId,
      seasonId,
    };
  });

  var newTeams = teams.filter(
    (team: any) =>
      !dbRecords.find(
        (dbRecord) => dbRecord.apiFootballId === team.apiFootballId
      )
  );

  if (newTeams.length > 0) {
    const creation = await prisma.team.createMany({ data: newTeams });
    console.log({ creation });
  } else {
    console.log("no teams created");
  }
}
