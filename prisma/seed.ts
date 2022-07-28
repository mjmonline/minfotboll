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

const apiFootballLeagues = [
  { id: 39, country: "england" },
  { id: 140, country: "spain" },
  { id: 135, country: "italy" },
  { id: 61, country: "france" },
  // { id: 113, country: "sweden" },
];

async function doBackfill() {
  const thisYear = new Date().getFullYear();
  const startYear = thisYear - 1;
  const endYear = thisYear;
  let firstRun = true;

  for (const league of apiFootballLeagues) {
    firstRun && (await doBackfillCountries());
    await doBackfillVenues(league.country);
    firstRun && (await doBackfillLeagues());
    firstRun && (await doBackfillSeasons());

    for (let i = startYear; i <= endYear; i++) {
      await doBackfillTeams(league.id, i);
      await doBackfillFixtures(league.id, i);
      await doBackfillStandings(league.id, i);
    }
    firstRun = false;
  }
}

doBackfill();
