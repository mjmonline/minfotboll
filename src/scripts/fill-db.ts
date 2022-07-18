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

async function getStandings(season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/standings?league=39&season=${season}`,
      config
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function getCountries() {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/countries`,
      config
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function getVenues(country: string) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/venues?country=${country}`,
      config
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function doBackfillTeams(season: number) {
  const data = await getTeams(season);
  const venues = await prisma.venue.findMany();

  const teams = data.response.map((t: any) => {
    const venueId = venues.find((v) => v.apiFootballId === t.venue.id)?.id;

    return {
      apiFootballId: Number(t.team.id),
      name: t.team.name,
      code: t.team.code,
      country: t.team.country,
      founded: t.team.founded.toString(),
      national: t.team.national,
      logo: t.team.logo,
      venueId,
    };
  });

  const creation = await prisma.team.createMany({ data: teams });

  console.log(creation);
}

const doBackfillFixtures = async (season: number) => {
  const data = await getFixtures(season);

  const venues = await prisma.venue.findMany();
  const teams = await prisma.team.findMany();

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

const doBackfillCountries = async () => {
  const data = await getCountries();

  const countries = data.response.map((c: any) => {
    return {
      name: c.name,
      code: c.code,
      flag: c.flag,
    };
  });

  const creation = await prisma.country.createMany({ data: countries });

  console.log(creation);
};

const doBackfillVenues = async (country: string) => {
  const data = await getVenues(country);

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

  const creation = await prisma.venue.createMany({ data: venues });

  console.log(creation);
};

const doBackfillLeagues = async () => {
  const data = await getLeagues();
  const countries = await prisma.country.findMany();

  const leagues = data.response.map((l: any) => {
    const countryId = countries.find((c) => c.name === l.country.name)?.id;

    return {
      apiFootballId: Number(l.league.id),
      name: l.league.name,
      countryId,
      type: l.league.type,
      logo: l.league.logo,
    };
  });

  const creation = await prisma.league.createMany({ data: leagues });

  console.log(creation);
};

const doBackfillStandings = async (season: number) => {
  const data = await getStandings(season);

  const teams = await prisma.team.findMany();

  const standings = data.response[0].league.standings[0].map(
    (x: any, i: number) => {
      const teamId = teams.find((t: any) => {
        return t.apiFootballId === x.team.id;
      })?.id;

      return {
        rank: x.rank,
        teamId,
        points: x.points,
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
        season,
      };
    }
  );

  const creation = await prisma.standing.createMany({ data: standings });

  console.log(creation);
};

async function doBackfill() {
  // await doBackfillCountries();
  // await doBackfillVenues("england");
  // await doBackfillLeagues();
  // await doBackfillTeams(2014);
  // await doBackfillFixtures(2014);
  // await doBackfillStandings(2014);
}

doBackfill();
