import "dotenv/config";
import axios from "axios";

import { prisma } from "../../src/server/db/client";
import { apiFootballConfig } from "../seed";

async function getCountries() {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/countries`,
      apiFootballConfig
    );
    return data;
  } catch (err) {
    throw err;
  }
}

export const doBackfillCountries = async () => {
  const data = await getCountries();
  const dbRecords = await prisma.country.findMany();

  const countries = data.response.map((c: any) => {
    return {
      name: c.name,
      code: c.code,
      flag: c.flag,
    };
  });

  var newCountries = countries.filter(
    (country: any) =>
      !dbRecords.find((dbRecord) => dbRecord.name === country.name)
  );

  if (newCountries.length > 0) {
    const creation = await prisma.country.createMany({ data: newCountries });
    console.log({ creation });
  } else {
    console.log("no countries created");
  }
};
