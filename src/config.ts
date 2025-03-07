import type { ConfigBacktest } from "./domain/ConfigBacktest";
import type { ConfigTrade } from "./domain/ConfigTrade";
import { Interval } from "./domain/Interval";
import type { Strategy } from "./domain/Strategy";
import { getDate, type DateString } from "./utils/getDate";
import { getSuggestedDates } from "./utils/getSuggestedDates";

import { stg as rsiDivergency5m } from "./strategies/rsiDivergency5m";
import { stg as supertrend5m } from "./strategies/supertrend5m";

const interval = Interval["5m"];
const { backtestStart, backtestEnd, forwardTestEnd } = getSuggestedDates({
  candleCount: 50000,
  backtestPercent: 0.75,
  interval,
  lastDate: getDate().dateMs,
});

export const DATA_BASE_NAME = "./db/rsiDivergency5m.db";
export const strategies: Strategy[] = [rsiDivergency5m];
export const backtestConfig: ConfigBacktest = {
  backtestStart,
  backtestEnd,
  forwardTestEnd,
  interval,
  lookBackLength: 200,
  maxTradeLengthArray: [100],
  maxProtectedPositions: 2,

  minAmountToTradeUSDT: 6,
  leverage: 10,
  balanceUSDT: 27,
  feePt: 0.0005,

  maxSlArray: [8 / 100],
  tpSlRatioArray: [6],
  minSlTp: 5 / 100,
  breakEventAlerts: [
    {
      trigger: 5 / 100,
      break: 1 / 100,
      minLength: 3,
    },
    {
      trigger: 3 / 100,
      break: 2 / 100,
      minLength: 70,
    },
  ],

  steps: {
    overrideHistoricalRecords: true,
    overrideAlerts: true,
  },
  apiLimit: 500,
};
export const tradeConfig: ConfigTrade = {
  interval,
  lookBackLength: 200,
  maxTradeLength: 100,

  maxSl: 8 / 100,
  tpSlRatio: 6,
  minSlTp: 5 / 100,
  breakEventAlerts: [
    {
      trigger: 5 / 100,
      break: 1 / 100,
      minLength: 3,
    },
    {
      trigger: 3 / 100,
      break: 2 / 100,
      minLength: 70,
    },
  ],

  riskPt: 1 / 100,
  minAmountToTradeUSDT: 6,
  feePt: 0.0005,

  leverage: 10,
  setLeverage: false,

  maxProtectedPositions: 2,
  maxHedgePositions: 20,

  apiLimit: 500,
};
