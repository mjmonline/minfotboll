import "dotenv/config";
import axios from "axios";

import { prisma } from "../../src/server/db/client";
import { apiFootballConfig } from "../seed";

async function getLeagues() {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/leagues`,
      apiFootballConfig
    );
    return data;
  } catch (err) {
    throw err;
  }
}

export const doBackfillSeasons = async () => {
  const data = await getLeagues();
  const leagues = await prisma.league.findMany();
  const dbRecords = await prisma.season.findMany();

  const seasons = data.response
    .map((l: any) => {
      const leagueId = leagues.find(
        (le) => le.apiFootballId === l.league.id
      )?.id;

      const seasonsFromLeaguesApi = l.seasons.map((season: any) => ({
        year: season.year,
        start: season.start,
        end: season.end,
        leagueId,
      }));

      return seasonsFromLeaguesApi;
    })
    .flat();

  var newSeasons = seasons.filter(
    (season: any) =>
      !dbRecords.find(
        (dbRecord) =>
          dbRecord.year === season.year && dbRecord.leagueId === season.leagueId
      )
  );

  if (newSeasons.length > 0) {
    const creation = await prisma.season.createMany({ data: newSeasons });
    console.log({ creation });
  } else {
    console.log("no seasons created");
  }
};
