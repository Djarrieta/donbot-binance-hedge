Run bun DBRestart to create the local database.
Select the amount of time you want backtest in src/InitialParams.lookBackLengthBacktest in milliseconds eg. (7 * Interval["1d"]) / Interval["5m"] is 7 days.
Run bun saveBacktestData in order to get the data from the Binance API.
You can check the data running bun showBacktestData.
Fill /src/strategies/index.ts/chosenStrategies array with all available strategies.
Check every strategy in /src/strategies has ALLOWED_PAIRS=[]
Run bun saveAccStats to save statistics in order to define values for take profit, stop loss and max trade length.
You can check the results running bun showAccStats.
Define values in src/InitialParams for defaultTP, defaultTP and maxTradeLength.
Choose only the first strategy in /src/strategies/index.ts/chosenStrategies.
Run bun saveSnapStats to save stats for this strategy and define winning symbols. 
Run bun showSnapStats to see the winning symbols list
Fill array in /src/strategies/myStrategy.ts ALLOWED_PAIRS=[] to the resulting list of symbols
Repeat the process with other strategies of saveSnapStats, and fill ALLOWED_PAIRS.
Fill /src/strategies/index.ts/chosenStrategies array with all available strategies.
Run bun saveFinalAccStats in order to has the final stats.
Run bun showAccStats to see the final results. 




