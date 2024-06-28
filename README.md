# Start Script
To run the script using Docker, execute `./start.sh`. Alternatively, you can run it using `bun start`.

# Back Testing
There are two types of back-testing: Snapshot and Accumulate.

## Snapshot Back-Testing
Snapshot back-testing analyzes the pattern of look-back candles, simulates an entry, and evaluates if it wins or loses within the maximum candle length of the next candles. No context about other possible entries is considered. Positions are overlapping, and values like the Sharpe ratio do not make sense.

## Accumulate Back-Testing
Accumulate back-testing is oriented toward a more realistic situation where the maximum number of open positions is considered.

### Steps for Back-Testing
1. Run `bun DBRestart` to create the local database or clear old data.
2. Select the amount of time you want for back-testing in `src/Params.lookBackLengthBacktest` in milliseconds (e.g., `(7 * Interval["1d"]) / Interval["5m"]` for 7 days). You can check other parameters here.
3. Run `bun saveBacktestData` to get the candlestick data for every available symbol from the Binance API.
4. Check the data by running `bun showBacktestData`.
5. Fill the `/src/strategies/index.ts/chosenStrategies` array with strategies to test.
6. Ensure that every strategy in `/src/strategies` has `ALLOWED_PAIRS=[]` as desired.
7. Run `bun saveAccStats` to save statistics to define values for take profit, stop loss, and max trade length.
8. Check the results by running `bun showAccStats`.
9. Run `bun saveSnapStats` to save stats for this strategy and define winning symbols.
10. Run `bun showSnapStats` to see the winning symbols list.






