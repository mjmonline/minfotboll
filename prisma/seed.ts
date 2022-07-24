import "dotenv/config";
import { env } from "node:process";

import {
  doBackfillCountries,
  doBackfillVenues,
  doBackfillLeagues,
  doBackfillSeasons,
  doBackfillTeams,
  doBackfillFixtures,
  doBackfillStandings,
} from "./seedPartials";

export const apiFootballConfig = env.API_FOOTBALL_TOKEN
  ? {
      headers: {
        "x-rapidapi-host": "v3.football.api-sports.io",
        "x-rapidapi-key": env.API_FOOTBALL_TOKEN,
      },
    }
  : {};

const apiFootballLeagueIds = {
  premireLeague: 39,
  laLiga: 140,
  serieA: 135,
  ligue1: 61,
  allsvenskan: 113,
};

async function doBackfill() {
  const thisYear = new Date().getFullYear();
  const startYear = thisYear - 1;
  const endYear = thisYear;

  // await doBackfillCountries();
  await doBackfillVenues("spain");
  // await doBackfillLeagues();
  // await doBackfillSeasons();

  for (let i = startYear; i <= endYear; i++) {
    await doBackfillTeams(apiFootballLeagueIds.laLiga, i);
    await doBackfillFixtures(apiFootballLeagueIds.laLiga, i);
    await doBackfillStandings(apiFootballLeagueIds.laLiga, i);
  }
}

doBackfill();
