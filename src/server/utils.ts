import { backtestConfig, DATA_BASE_NAME, strategies } from "../config";
import { StatsDataService } from "../infrastructure/StatsDataService";
import { processStats } from "../utils/processStats";

export type TimeFrame = "Backtest" | "Forwardtest" | "All";

export type GetPositionsListProps = {
  sl: number;
  tpSlRatio: number;
  maxTradeLength: number;
  timeFrame: TimeFrame;
  pair: "All" | "Winning" | string;
};

export const getPositionsList = ({
  sl,
  tpSlRatio,
  maxTradeLength,
  timeFrame,
  pair,
}: GetPositionsListProps) => {
  const statsDataService = new StatsDataService({
    databaseName: DATA_BASE_NAME,
    tableName: "STATS_DATA",
  });

  const statsList = statsDataService
    .getStats()
    .sort((a, b) => b.accPnlAcc - a.accPnlAcc);

  let positions = statsDataService.getPositions({
    sl,
    tpSlRatio,
    maxTradeLength,
  });
  if (timeFrame === "Backtest")
    positions = positions.filter(
      (p) => p.startTime <= backtestConfig.backtestEnd
    );

  if (timeFrame === "Forwardtest")
    positions = positions.filter(
      (p) => p.startTime > backtestConfig.backtestEnd
    );

  const { winningPairs } = processStats({
    positions,
    sl,
    tpSlRatio,
    maxTradeLength,
    strategies,
    interval: backtestConfig.interval,
  });
  const pairsInStrategies = Array.from(
    new Set(strategies.map((s) => s.allowedPairs).flat())
  );
  if (pairsInStrategies.length) {
    positions = positions.filter((p) => pairsInStrategies.includes(p.pair));
  }
  if (pair && pair !== "All" && pair !== "Winning") {
    positions = positions.filter((p) => p.pair === pair);
  }
  if (pair === "Winning") {
    positions = positions.filter((p) => winningPairs.includes(p.pair));
  }

  const {
    winRate,
    winRateAcc,
    accPnlAcc,
    avPnl,
    avPnlAcc,
    badRunAcc,
    badRunMonteCarloAcc,
    drawdownAcc,
    drawdownMonteCarloAcc,
    positionsAcc,
    sharpeRatio,
    start,
    end,
    totalDays,
    avPnlPerDay,
    avPosPerDay,
  } = processStats({
    positions,
    sl,
    tpSlRatio,
    maxTradeLength,
    strategies,
    interval: backtestConfig.interval,
  });

  return {
    winRate,
    winRateAcc,
    accPnlAcc,
    avPnl,
    avPnlAcc,
    badRunAcc,
    badRunMonteCarloAcc,
    drawdownAcc,
    drawdownMonteCarloAcc,
    positionsAcc,
    sharpeRatio,
    start,
    end,
    totalDays,
    avPnlPerDay,
    avPosPerDay,
    statsList,
    positions,
  };
};
