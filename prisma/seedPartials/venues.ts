import "dotenv/config";
import axios from "axios";

import { prisma } from "../../src/server/db/client";
import { apiFootballConfig } from "../seed";

async function getVenues(country: string) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/venues?country=${country}`,
      apiFootballConfig
    );
    return data;
  } catch (err) {
    throw err;
  }
}

export const doBackfillVenues = async (country: string) => {
  const data = await getVenues(country);
  const dbRecords = await prisma.venue.findMany();

  const venues = data.response.map((v: any) => {
    return {
      apiFootballId: Number(v.id),
      name: v.name,
      address: v.address,
      city: v.city,
      capacity: Number(v.capacity),
      surface: v.surface,
      image: v.image,
    };
  });

  var newVenues = venues.filter(
    (venue: any) =>
      !dbRecords.find(
        (dbRecord) => dbRecord.apiFootballId === venue.apiFootballId
      )
  );

  if (newVenues.length > 0) {
    const creation = await prisma.venue.createMany({ data: newVenues });
    console.log({ creation });
  } else {
    console.log("no venues created");
  }
};
