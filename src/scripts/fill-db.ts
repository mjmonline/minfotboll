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

async function getTeams(season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/teams?league=39&season=${season}`,
      config
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function getFixtures(season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/fixtures?league=39&season=${season}`,
      config
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function getLeagues() {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/leagues`,
      config
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function doBackfillTeams(season: number) {
  const data = await getTeams(season);
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
        venueId: isDuplicateVenue
          ? acc.venue.find((v: any) => v.id === cur.venue.id).id
          : i + 1,
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
}

const doBackfillFixtures = async (season: number) => {
  const data = await getFixtures(season);

  const venues = await prisma.venue.findMany();
  const teams = await prisma.team.findMany();

  console.log(JSON.stringify(data.response, null, 2));

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
      id: i + 1,
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

      leagueId: x.league.id,

      season,
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

  const creation = await prisma.fixture.createMany({ data: fixtures });

  console.log(creation);
};

const doBackfillLeagues = async () => {
  const data = await getLeagues();
  let uniqueCountries: string[] = [];

  const { leagues, countries } = data.response.reduce(
    (acc: any, cur: any, i: number) => {
      const isDuplicateCountry = uniqueCountries.includes(cur.country.name);

      if (!isDuplicateCountry) {
        uniqueCountries.push(cur.country.name);
        acc.countries.push({
          id: i + 1,
          name: cur.country.name,
          code: cur.country.code,
          flag: cur.country.flag,
        });
      }

      acc.leagues.push({
        id: i + 1,
        apiFootballId: Number(cur.league.id),
        name: cur.league.name,
        countryId: isDuplicateCountry
          ? acc.countries.find((c: any) => c.name === cur.country.name).id
          : i + 1,
        type: cur.league.type,
        logo: cur.league.logo,
      });

      return acc;
    },
    { leagues: [], countries: [] }
  );

  const leaguesCreation = await prisma.league.createMany({ data: leagues });
  const countriesCreation = await prisma.country.createMany({
    data: countries,
  });

  console.log(leaguesCreation);
  console.log(countriesCreation);
};

// doBackfillLeagues();
// doBackfillTeams(2022);
// doBackfillFixtures(2022);
