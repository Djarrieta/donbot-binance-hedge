Certainly! Here are the steps with corrected numbering:

1. Run `bun DBRestart` to create the local database or clear old data.
2. Select the amount of time you want for backtest in `src/InitialParams.lookBackLengthBacktest` in milliseconds (e.g., `(7 * Interval["1d"]) / Interval["5m"]` for 7 days).
3. Run `bun saveBacktestData` to get the candlestick data for every available symbol from the Binance API.
4. You can check the data by running `bun showBacktestData`.
5. Fill the `/src/strategies/index.ts/chosenStrategies` array with all available strategies.
6. Check that every strategy in `/src/strategies` has `ALLOWED_PAIRS=[]`.
7. Check `src/InitialParams` props `backtestSLArray`, `backtestTPArray`, and `backtestMaxTradeLengthArray`.
8. Run `bun saveAccStats` to save statistics in order to define values for take profit, stop loss, and max trade length.
9. You can check the results by running `bun showAccStats`.
10. Define values in `src/InitialParams` for `defaultTP`, `defaultSL`, and `maxTradeLength`.
11. Choose only the first strategy in `/src/strategies/index.ts/chosenStrategies`.
12. Run `bun saveSnapStats` to save stats for this strategy and define winning symbols.
13. Run `bun showSnapStats` to see the winning symbols list.
14. Fill the array in `/src/strategies/[myStrategy].ts` `ALLOWED_PAIRS=[]` with the resulting list of symbols.
15. Repeat the process with other strategies of `saveSnapStats`, and fill `ALLOWED_PAIRS`.
16. Fill the `/src/strategies/index.ts/chosenStrategies` array with all available strategies.
17. Run `bun saveFinalAccStats` to get the final stats.
18. Run `bun showAccStats` to see the final results.
19. Optionally you can run `bun saveSnapStats` again and them bun `showSnapClosedPosStats` and bun `showSnapClosedPosStats` in order to see all the positions calculated for the analysis.



