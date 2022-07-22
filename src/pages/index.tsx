import type { NextPage } from "next";
import Head from "next/head";
import Img from "next/image";
import { useState } from "react";
import {
  FormControl,
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
} from "@mui/material";

import { trpc } from "../utils/trpc";

function getSeasonSpan(start: number, end: string) {
  const endYear = new Date(end).getFullYear().toString().slice(-2);

  return `${start}/${endYear}`;
}

const Home: NextPage = () => {
  const [season, setSeason] = useState(new Date().getFullYear());
  const { data } = trpc.useQuery(["football.get-standings", season]);
  const { data: seasonsData } = trpc.useQuery(["football.get-seasons"]);

  const handleChange = (e: SelectChangeEvent<number>) => {
    setSeason(Number(e.target.value));
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col w-1/2 min-h-screen mx-auto">
        <h1 className="font-extrabold text-center text-7xl">
          Create <span className="text-blue-500">T3</span> App
        </h1>
        <div className="w-fit">
          {data && seasonsData && (
            <>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Season</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  value={season}
                  label="Season"
                  onChange={handleChange}
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

export default Home;
