import { rsi } from "technicalindicators";
import { Interval } from "../domain/Interval";
import { Strategy, type StrategyResponse } from "../domain/Strategy";

export const stg = new Strategy({
  stgName: "rsiDivergency5m",
  lookBackLength: 200,
  interval: Interval["5m"],
  allowedPairs: [
    "TRUUSDT",
    "1000LUNCUSDT",
    "CFXUSDT",
    "BLURUSDT",
    "HIFIUSDT",
    "BEAMXUSDT",
    "BICOUSDT",
    "CAKEUSDT",
    "ZETAUSDT",
    "NFPUSDT",
    "PIXELUSDT",
    "MYROUSDT",
    "PORTALUSDT",
    "ENAUSDT",
    "REZUSDT",
  ],

  validate({ candlestick, pair }) {
    const response: StrategyResponse = {
      positionSide: null,
      stgName: this.stgName,
      pair,
    };

    if (candlestick.length < this.lookBackLength) return response;
    if (this.allowedPairs?.length && !this.allowedPairs.includes(pair))
      return response;

    const MIN_RSI = 30;
    const CANDLESTICK_SIZE = 50;

    const closePrices = candlestick.map((candle) => candle.close);
    const rsiArray = rsi({ period: 14, values: closePrices });

    let candlestickValues: number[] = [];

    candlestick.forEach(({ close, high, low, open }) => {
      candlestickValues.push(close, high, low, open);
    });

    const lastPrice = candlestickValues[candlestickValues.length - 1];

    if (
      rsiArray[rsiArray.length - 1] <= MIN_RSI &&
      rsiArray[rsiArray.length - 2] <= MIN_RSI &&
      rsiArray[rsiArray.length - 1] > rsiArray[rsiArray.length - 2]
    ) {
      const firstZeroCrossingIndex = [...rsiArray]
        .reverse()
        .findIndex((arrayVal) => arrayVal > MIN_RSI);

      const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
      const secondRange = rsiArray.slice(
        rsiArray.length - CANDLESTICK_SIZE,
        rsiArray.length - firstZeroCrossingIndex
      );

      const firstMin = Math.min(
        ...firstRange.map((value) => Number(value) || 0)
      );
      const secondMin = Math.min(
        ...secondRange.map((value) => Number(value) || 0)
      );

      if (firstMin !== 0 && secondMin !== 0 && firstMin > secondMin) {
        const minPrevPrice = Math.min(
          ...candlestick.slice(-CANDLESTICK_SIZE).map((candle) => candle.low)
        );
        let sl = (lastPrice - minPrevPrice) / lastPrice;

        response.positionSide = "LONG";
        response.sl = sl;
      }
    }

    if (
      rsiArray[rsiArray.length - 1] >= 100 - MIN_RSI &&
      rsiArray[rsiArray.length - 2] >= 100 - MIN_RSI &&
      rsiArray[rsiArray.length - 1] < rsiArray[rsiArray.length - 2]
    ) {
      const firstZeroCrossingIndex = [...rsiArray]
        .reverse()
        .findIndex((arrayVal) => arrayVal < 100 - MIN_RSI);

      const firstRange = rsiArray.slice(-firstZeroCrossingIndex);
      const secondRange = rsiArray.slice(
        rsiArray.length - CANDLESTICK_SIZE,
        rsiArray.length - firstZeroCrossingIndex
      );

      const firstMax = Math.max(
        ...firstRange.map((value) => Number(value) || 0)
      );
      const secondMax = Math.max(
        ...secondRange.map((value) => Number(value) || 0)
      );

      if (firstMax !== 0 && secondMax !== 0 && firstMax < secondMax) {
        const maxPrevPrice = Math.max(
          ...candlestick.slice(-CANDLESTICK_SIZE).map((candle) => candle.high)
        );

        let sl = (maxPrevPrice - lastPrice) / lastPrice;

        response.sl = sl;
        response.positionSide = "SHORT";
      }
    }

    return response;
  },
});

// ┌───┬─────────────────┬────────────────────────┬─────────────────────────┬─────────────────────────┬───────────────┬────────┬─────────────┐
// │   │ SL              │ WINRATE                │ AVPNL                   │ ACCPNL                  │ Drawdown      │ BadRun │ PerDay      │
// ├───┼─────────────────┼────────────────────────┼─────────────────────────┼─────────────────────────┼───────────────┼────────┼─────────────┤
// │ 0 │ sl tp/sl MaxLen │ all     accWP      fwd │ all      accWP      fwd │ all      accWP      fwd │ DD MC         │ BR MC  │ pnl     Qty │
// │ 1 │ 8.00% 6 100     │ 53.16% 52.94% 52.14%   │ 0.04% 0.05% 0.03%       │ 224.58% 56.04% 15.76%   │ 20.43% 31.98% │ 8 9    │ 0.07% 1.41  │
// └───┴─────────────────┴────────────────────────┴─────────────────────────┴─────────────────────────┴───────────────┴────────┴─────────────┘
