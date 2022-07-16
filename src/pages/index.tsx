import type { NextPage } from "next";
import Head from "next/head";
import Img from "next/image";
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data } = trpc.useQuery(["football.get-standings"]);

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
          {data && (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Position</TableCell>
                    <TableCell>Club</TableCell>
                    <TableCell align="right">Played</TableCell>
                    <TableCell align="right">Won</TableCell>
                    <TableCell align="right">Drawn</TableCell>
                    <TableCell align="right">Lost</TableCell>
                    <TableCell align="right">GF</TableCell>
                    <TableCell align="right">GA</TableCell>
                    <TableCell align="right">GD</TableCell>
                    <TableCell align="right">Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((t, i) => (
                    <TableRow
                      key={t.team.name}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {t.rank}
                      </TableCell>
                      <TableCell>{t.team.name}</TableCell>
                      <TableCell align="right">{t.all.played}</TableCell>
                      <TableCell align="right">{t.all.win}</TableCell>
                      <TableCell align="right">{t.all.draw}</TableCell>
                      <TableCell align="right">{t.all.lose}</TableCell>
                      <TableCell align="right">{t.all.goals.for}</TableCell>
                      <TableCell align="right">{t.all.goals.against}</TableCell>
                      <TableCell align="right">{t.goalsDiff}</TableCell>
                      <TableCell align="right">{t.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
