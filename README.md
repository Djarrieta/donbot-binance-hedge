There are two types of back-testing: Snapshot and Accumulate. Snapshot is analyze the pattern of look-back candles simulate and entry and see if win or lose in the max-candle-length next candles. No context about other possible entries is considered, overlaping is allowed. It is important to see the ; In other hand, Accumulate back-testing is 

1. Run `bun DBRestart` to create the local database or clear old data.
2. Select the amount of time you want for backtest in `src/Params.lookBackLengthBacktest` in milliseconds (e.g., `(7 * Interval["1d"]) / Interval["5m"]` for 7 days). You can check other params here.
3. Run `bun saveBacktestData` to get the candlestick data for every available symbol from the Binance API.
4. You can check the data by running `bun showBacktestData`.
5. Fill the `/src/strategies/index.ts/chosenStrategies` array with all available strategies.
6. Check that every strategy in `/src/strategies` has `ALLOWED_PAIRS=[]`.
8. Run `bun saveAccStats` to save statistics in order to define values for take profit, stop loss, and max trade length.
9. You can check the results by running `bun showAccStats`.
12. Run `bun saveSnapStats` to save stats for this strategy and define winning symbols.
13. Run `bun showSnapStats` to see the winning symbols list.
17. Run `bun saveFinalAccStats` to get the final stats.
18. Run `bun showAccStats` to see the final results.




