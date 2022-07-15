import "dotenv/config";
import axios from "axios";
import { env } from "node:process";

import { prisma } from "../server/db/client";

var config = env.API_FOOTBALL_TOKEN
  ? {
      headers: {
        "x-rapidapi-host": "v3.football.api-sports.io",
        "x-rapidapi-key": env.API_FOOTBALL_TOKEN,
      },
    }
  : {};

async function getTeams() {
  try {
    const { data } = await axios.get(
      "https://v3.football.api-sports.io/teams?league=39&season=2022",
      config
    );

    return data;
  } catch (err) {
    throw err;
  }
}

const doBackfillTeams = async () => {
  const data = await getTeams();
  let uniqueVenueIds: string[] = [];

  const { teams, venues } = data.response.reduce(
    (acc: any, cur: any, i: number) => {
      const isDuplicateVenue = uniqueVenueIds.includes(cur.venue.id);

      if (!isDuplicateVenue) {
        uniqueVenueIds.push(cur.venue.id);
        acc.venues.push({
          id: i + 1,
          apiFootballId: Number(cur.venue.id),
          name: cur.venue.name,
          address: cur.venue.address,
          city: cur.venue.city,
          capacity: Number(cur.venue.capacity),
          surface: cur.venue.surface,
          image: cur.venue.image,
        });
      }

      acc.teams.push({
        id: i + 1,
        apiFootballId: Number(cur.team.id),
        name: cur.team.name,
        code: cur.team.code,
        country: cur.team.country,
        founded: cur.team.founded.toString(),
        national: cur.team.national,
        logo: cur.team.logo,
        venueId: i + 1,
      });

      return acc;
    },
    { teams: [], venues: [] }
  );

  // Save venue first because venueid is used in team table
  const creationVenues = await prisma.venue.createMany({ data: venues });
  const creationTeams = await prisma.team.createMany({ data: teams });

  console.log("creationTeams?", creationTeams);
  console.log("creationVenues?", creationVenues);
};

// const doBackfillFixtures = async () => {
//   try {
//     const { data } = await axios.get(
//       "https://v3.football.api-sports.io/fixtures?league=39&season=2022",
//       config
//     );

//     const creation = await prisma.football.createMany({ data });
//     console.log(data.response);
//   } catch (error) {
//     console.error(error);
//   }
// };

doBackfillTeams();
// doBackfillFixtures();
