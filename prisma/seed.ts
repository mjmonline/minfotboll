import "dotenv/config";
import axios from "axios";
import { env } from "node:process";

import { prisma } from "../src/server/db/client";

var config = env.API_FOOTBALL_TOKEN
  ? {
      headers: {
        "x-rapidapi-host": "v3.football.api-sports.io",
        "x-rapidapi-key": env.API_FOOTBALL_TOKEN,
      },
    }
  : {};

async function getTeams(league: number, season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/teams?league=${league}&season=${season}`,
      config
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function getFixtures(league: number, season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/fixtures?league=${league}&season=${season}`,
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

async function getStandings(league: number, season: number) {
  try {
    const { data } = await axios.get(
      `https://v3.football.api-sports.io/standings?league=${league}&season=${season}`,
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

async function doBackfillTeams(
  apiFootballLeagueId: number,
  seasonYear: number
) {
  const data = await getTeams(apiFootballLeagueId, seasonYear);
  const venues = await prisma.venue.findMany();
  const league = await prisma.league.findFirst({
    where: { apiFootballId: apiFootballLeagueId },
  });
  const leagueId = league?.id;

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
    };
  });

  const creation = await prisma.team.createMany({ data: teams });

  console.log(creation);
}

const doBackfillFixtures = async (
  apiFootballLeagueId: number,
  seasonYear: number
) => {
  const data = await getFixtures(apiFootballLeagueId, seasonYear);
  const venues = await prisma.venue.findMany();
  const teams = await prisma.team.findMany();
  const league = await prisma.league.findFirst({
    where: { apiFootballId: apiFootballLeagueId },
  });
  const leagueId = league?.id;
  const season = await prisma.season.findFirst({
    where: { year: seasonYear, leagueId },
  });
  const seasonId = season?.id;

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
      leagueId,
      seasonId,
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
    const countryName = countries.find((c) => c.name === l.country.name)?.name;

    return {
      apiFootballId: Number(l.league.id),
      name: l.league.name,
      type: l.league.type,
      logo: l.league.logo,
      countryName,
    };
  });

  const creation = await prisma.league.createMany({ data: leagues });

  console.log(creation);
};

const doBackfillSeasons = async () => {
  const data = await getLeagues();
  const leagues = await prisma.league.findMany();

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

  const creation = await prisma.season.createMany({ data: seasons });

  console.log(creation);
};

const doBackfillStandings = async (
  apiFootballLeagueId: number,
  seasonYear: number
) => {
  const data = await getStandings(apiFootballLeagueId, seasonYear);
  const teams = await prisma.team.findMany();
  const league = await prisma.league.findFirst({
    where: { apiFootballId: apiFootballLeagueId },
  });
  const leagueId = league?.id;
  const season = await prisma.season.findFirst({
    where: { year: seasonYear, leagueId },
  });
  const seasonId = season?.id;

  const standings = data.response[0].league.standings[0].map(
    (x: any, i: number) => {
      const teamId = teams.find((t: any) => {
        return t.apiFootballId === x.team.id;
      })?.id;

      return {
        rank: x.rank,
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
        teamId,
        leagueId,
        seasonId,
      };
    }
  );

  const creation = await prisma.standing.createMany({ data: standings });

  console.log(creation);
};

async function doBackfill() {
  const apiFootballLeagueId = 39;
  const thisYear = new Date().getFullYear();
  const startYear = thisYear - 1;

  await doBackfillCountries();
  await doBackfillVenues("england");
  await doBackfillLeagues();
  await doBackfillSeasons();

  for (let i = startYear; i <= thisYear; i++) {
    await doBackfillTeams(apiFootballLeagueId, i);
    await doBackfillFixtures(apiFootballLeagueId, i);
    await doBackfillStandings(apiFootballLeagueId, i);
  }
}

doBackfill();
