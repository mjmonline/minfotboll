import type { NextPage } from "next";
import Head from "next/head";
import Img from "next/image";
import { useState } from "react";
import {
  FormControl,
  Box,
  Avatar,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Typography,
} from "@mui/material";
import { green, red, grey } from "@mui/material/colors";

import { trpc } from "../utils/trpc";

function getSeasonSpan(start: number, end: string) {
  const endYear = new Date(end).getFullYear().toString().slice(-2);

  return `${start}/${endYear}`;
}

const MatchFormItem: React.FC<{ outcome: string }> = ({ outcome }) => {
  let bgcolor = "";
  switch (outcome) {
    case "W":
      bgcolor = green[400];
      break;
    case "D":
      bgcolor = grey[400];
      break;
    case "L":
      bgcolor = red[400];
      break;
  }
  return (
    <Avatar sx={{ bgcolor, width: 24, height: 24 }}>
      <Typography variant="caption" component="span">
        {outcome}
      </Typography>
    </Avatar>
  );
};

const Standings: NextPage = () => {
  const [season, setSeason] = useState(new Date().getFullYear());
  const [league, setLeague] = useState(39);
  const { data } = trpc.useQuery([
    "football.get-standings",
    { season, league },
  ]);
  const { data: seasonsData } = trpc.useQuery(["football.get-seasons", league]);
  const { data: leaguesData } = trpc.useQuery(["football.get-leagues"]);

  const handleSeasonChange = (e: SelectChangeEvent<number>) => {
    setSeason(Number(e.target.value));
  };

  const handleLeagueChange = (e: SelectChangeEvent<number>) => {
    setLeague(Number(e.target.value));
  };

  return (
    <>
      <Head>
        <title>Min Fotboll - Standings</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col w-1/2 min-h-screen mx-auto">
        <div className="w-fit">
          {data && seasonsData && (
            <>
              <Box className="my-8">
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="select-label-league">League</InputLabel>
                  <Select
                    labelId="select-label-league"
                    value={league}
                    label="League"
                    onChange={handleLeagueChange}
                  >
                    {leaguesData?.map((league) => (
                      <MenuItem
                        key={`league-${league.name}`}
                        value={league.apiFootballId}
                      >
                        {league.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel id="select-label-season">Season</InputLabel>
                  <Select
                    labelId="select-label-season"
                    value={season}
                    label="Season"
                    onChange={handleSeasonChange}
                  >
                    {seasonsData.map((season) => {
                      const seasonSpan = getSeasonSpan(season.year, season.end);
                      return (
                        <MenuItem
                          key={`season-${season.year}`}
                          value={season.year}
                        >
                          {seasonSpan}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Position</TableCell>
                      <TableCell className="whitespace-nowrap">Club</TableCell>
                      <TableCell align="right">Played</TableCell>
                      <TableCell align="right">Won</TableCell>
                      <TableCell align="right">Drawn</TableCell>
                      <TableCell align="right">Lost</TableCell>
                      <TableCell align="right">GF</TableCell>
                      <TableCell align="right">GA</TableCell>
                      <TableCell align="right">GD</TableCell>
                      <TableCell align="right">
                        <b>Points</b>
                      </TableCell>
                      <TableCell align="right">Form</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((t) => (
                      <TableRow
                        key={`team-${t.team.name}-${season}`}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {t.rank}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="mr-4 shrink-0">
                              {t.team.logo && (
                                <Img
                                  src={t.team.logo}
                                  width={32}
                                  height={32}
                                  alt={t.team.name}
                                />
                              )}
                            </div>
                            {t.team.name}
                          </div>
                        </TableCell>
                        <TableCell align="right">{t.all.played}</TableCell>
                        <TableCell align="right">{t.all.win}</TableCell>
                        <TableCell align="right">{t.all.draw}</TableCell>
                        <TableCell align="right">{t.all.lose}</TableCell>
                        <TableCell align="right">{t.all.goals.for}</TableCell>
                        <TableCell align="right">
                          {t.all.goals.against}
                        </TableCell>
                        <TableCell align="right">{t.goalsDiff}</TableCell>
                        <TableCell align="right">
                          <b>{t.points}</b>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row">
                            {t.form?.split("").map((outcome) => (
                              <MatchFormItem
                                key={`outcome-${t.team.name}-${season}-${outcome}`}
                                outcome={outcome}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Standings;
