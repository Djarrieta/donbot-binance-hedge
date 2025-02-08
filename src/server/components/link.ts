import type { TimeFrame } from "../utils";

type LinkProps = {
  page?: "positions" | "stats";
  sl: number;
  tpSlRatio: number;
  maxTradeLength: number;
  timeFrame: TimeFrame;
  pair: string;
  positionsIndex?: number;
};

export const Link = ({
  page = "stats",
  sl,
  tpSlRatio,
  maxTradeLength,
  timeFrame,
  pair,
  positionsIndex = 0,
}: LinkProps) =>
  `http://localhost:3000/${page}?sl=${sl}&tpSlRatio=${tpSlRatio}&maxTradeLength=${maxTradeLength}&timeFrame=${timeFrame}&pair=${pair}&positionsIndex=${positionsIndex}`;
