

1. Run `bun DBRestart` to create the local database.
2. Select the amount of time you want for backtest in `src/InitialParams.lookBackLengthBacktest` in milliseconds (e.g., `(7 * Interval["1d"]) / Interval["5m"]` for 7 days).
3. Run `bun saveBacktestData` to get the data from the Binance API.
4. You can check the data by running `bun showBacktestData`.
5. Fill the `/src/strategies/index.ts/chosenStrategies` array with all available strategies.
6. Check that every strategy in `/src/strategies` has `ALLOWED_PAIRS=[]`.
7. Run `bun saveAccStats` to save statistics in order to define values for take profit, stop loss, and max trade length.
8. You can check the results by running `bun showAccStats`.
9. Define values in `src/InitialParams` for `defaultTP`, `defaultSL`, and `maxTradeLength`.
10. Choose only the first strategy in `/src/strategies/index.ts/chosenStrategies`.
11. Run `bun saveSnapStats` to save stats for this strategy and define winning symbols.
12. Run `bun showSnapStats` to see the winning symbols list.
13. Fill the array in `/src/strategies/myStrategy.ts` `ALLOWED_PAIRS=[]` with the resulting list of symbols.
14. Repeat the process with other strategies of `saveSnapStats`, and fill `ALLOWED_PAIRS`.
15. Fill the `/src/strategies/index.ts/chosenStrategies` array with all available strategies.
16. Run `bun saveFinalAccStats` to get the final stats.
17. Run `bun showAccStats` to see the final results.



