import { backtestConfig } from "../config";
import { ExchangeService } from "../infrastructure/ExchangeService.ts";
import { getDate } from "../utils/getDate.ts";
import { getPositionsList, type GetPositionsListProps } from "./utils.ts";

type PositionsProps = GetPositionsListProps & { positionsIndex: number };
export const Positions = async ({
  sl,
  tpSlRatio,
  maxTradeLength,
  timeFrame,
  pair,
  positionsIndex,
}: PositionsProps) => {
  const { positionsAcc } = getPositionsList({
    sl,
    tpSlRatio,
    maxTradeLength,
    timeFrame,
    pair,
  });

  const position = positionsAcc[positionsIndex];
  const start =
    position.startTime -
    backtestConfig.lookBackLength * backtestConfig.interval;
  const end = position.startTime + maxTradeLength * backtestConfig.interval;

  const shapes = [
    {
      type: "rect",
      x0: position.startTime,
      y0: position.entryPriceUSDT,
      x1: position.startTime + position.tradeLength * backtestConfig.interval,
      y1: position.entryPriceUSDT * (1 + position.pnl),
      line: {
        color:
          position.pnl > 0 ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 0, 0, 0.7)",
        width: 1,
      },
      fillcolor:
        position.pnl > 0 ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.3)",
    },
  ];
  const exchangeService = new ExchangeService();
  const candlesticks = await exchangeService.getCandlestick({
    start: start || 0,
    end: end || 0,
    pair,
    interval: backtestConfig.interval,
    candlestickAPILimit: backtestConfig.apiLimit,
  });

  const dates = candlesticks.map((candle) => getDate(candle.openTime).dateMs);

  const trace = {
    x: dates,
    close: candlesticks.map((candle) => candle.close),
    decreasing: { line: { color: "#7F7F7F" } },
    high: candlesticks.map((candle) => candle.high),
    increasing: { line: { color: "#17BECF" } },
    line: { color: "rgba(31,119,180,1)" },
    low: candlesticks.map((candle) => candle.low),
    open: candlesticks.map((candle) => candle.open),
    type: "ohlc",
    xaxis: "x",
    yaxis: "y",
  };

  return {
    head: `
            <title>Donbot Position</title>
            	<script src='https://cdn.plot.ly/plotly-3.0.0.min.js'></script>
            `,
    body: `
            <body>
                <div style="width:100%; height: 400px;">
                    <h2>Position Chart - ${pair}</h2>
                    <div id="chart"></div>
                </div>

                <script>
                   const trace = ${JSON.stringify(trace, null, 2)};

                    const data = [trace];

                    const layout = {
                    dragmode: 'zoom',
                    margin: {
                        r: 10,
                        t: 25,
                        b: 40,
                        l: 60
                    },
                    showlegend: false,
                    xaxis: {
                        autorange: true,
                        title: {
                        text: 'Date'
                        },
                        type: 'date',
                        rangeslider: {
                            visible: false
                        },
                    },
                    yaxis: {
                        autorange: true,
                        rangeslider: {
                            visible: false
                        },
                        type: 'linear'
                    },
                    shapes: ${JSON.stringify(shapes)}
                    };
                    Plotly.newPlot('chart', data, layout);
                </script>
            </body>
        `,
  };
};
