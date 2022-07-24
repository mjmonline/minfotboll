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

export const doBackfillLeagues = async () => {
  const data = await getLeagues();
  const countries = await prisma.country.findMany();
  const dbRecords = await prisma.league.findMany();

  const leagues = data.response.map((l: any) => {
    const countryName = countries.find((c) => c.name === l.country.name)?.name;

    return {
      apiFootballId: Number(l.league.id),
      name: l.league.name,
      type: l.league.type,
      logo: l.league.logo,
      countryName,
    };
  });

  var newLeagues = leagues.filter(
    (league: any) =>
      !dbRecords.find(
        (dbRecord) => dbRecord.apiFootballId === league.apiFootballId
      )
  );

  if (newLeagues.length > 0) {
    const creation = await prisma.league.createMany({ data: newLeagues });
    console.log({ creation });
  } else {
    console.log("no leagues created");
  }
};
