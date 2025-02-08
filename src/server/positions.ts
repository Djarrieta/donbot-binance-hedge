import { backtestConfig } from "../config";
import type { PositionSide } from "../domain/Position.ts";
import { ExchangeService } from "../infrastructure/ExchangeService.ts";
import { formatPercent } from "../utils/formatPercent.ts";
import { getDate } from "../utils/getDate.ts";
import { Anchor } from "./components/anchor.ts";
import { Link } from "./components/link.ts";
import { Table } from "./components/table.ts";
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

  const exitPrice =
    position.positionSide === "LONG"
      ? position.entryPriceUSDT *
        (1 +
          (position.pnl * backtestConfig.balanceUSDT) /
            backtestConfig.minAmountToTradeUSDT)
      : position.entryPriceUSDT *
        (1 -
          (position.pnl * backtestConfig.balanceUSDT) /
            backtestConfig.minAmountToTradeUSDT);

  const slPrice =
    position.positionSide === "LONG"
      ? position.entryPriceUSDT *
        (1 -
          (sl * backtestConfig.balanceUSDT) /
            backtestConfig.minAmountToTradeUSDT)
      : position.entryPriceUSDT *
        (1 +
          (sl * backtestConfig.balanceUSDT) /
            backtestConfig.minAmountToTradeUSDT);

  const tpPrice =
    position.positionSide === "LONG"
      ? position.entryPriceUSDT *
        (1 +
          (sl * tpSlRatio * backtestConfig.balanceUSDT) /
            backtestConfig.minAmountToTradeUSDT)
      : position.entryPriceUSDT *
        (1 -
          (sl * tpSlRatio * backtestConfig.balanceUSDT) /
            backtestConfig.minAmountToTradeUSDT);
  const shapes = [
    {
      type: "rect",
      x0: position.startTime,
      y0: position.entryPriceUSDT,
      x1: position.startTime + position.tradeLength * backtestConfig.interval,
      y1: exitPrice,
      line: {
        color:
          position.pnl > 0 ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 0, 0, 0.7)",
        width: 1,
      },
      fillcolor:
        position.pnl > 0 ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.3)",
    },
    // {
    //   type: "line",
    //   x0: position.startTime,
    //   y0: slPrice,
    //   x1: position.startTime + position.tradeLength * backtestConfig.interval,
    //   y1: slPrice,
    //   line: {
    //     color: "#FF0000",
    //     width: 2,
    //     dash: "dash",
    //   },
    // },
    // {
    //   type: "line",
    //   x0: position.startTime,
    //   y0: tpPrice,
    //   x1: position.startTime + position.tradeLength * backtestConfig.interval,
    //   y1: tpPrice,
    //   line: {
    //     color: "#00FF00",
    //     width: 1,
    //     dash: "dash",
    //   },
    // },
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

  const pnlArray: {
    date: string;
    pnlPt: number;
    accPnlPt: number;
    side: PositionSide;
    pnlUsdt: number;
    balance: number;
    pair: string;
    len: string;
  }[] = [];

  let accPnlPt = 0;
  let balance = backtestConfig.balanceUSDT;
  for (let i = 0; i < positionsAcc.length; i++) {
    const pos = positionsAcc[i];

    accPnlPt += pos.pnl;
    balance = balance * (1 + pos.pnl);

    pnlArray.push({
      date: getDate(pos.startTime).dateString,
      side: pos.positionSide,
      pair: pos.pair,
      pnlPt: pos.pnl,
      accPnlPt,
      pnlUsdt: pos.pnl * balance,
      balance,
      len: `${pos.tradeLength.toFixed(0)}(${pos.secureLength?.toFixed(0)})`,
    });
  }

  return {
    head: `
            <title>Donbot Position</title>
            	<script src='https://cdn.plot.ly/plotly-3.0.0.min.js'></script>
            `,
    body: `
            <body>
                <div style="width:100%; display:flex; gap: 70px; flex-direction:column">
                ${Table({
                  title: "Position Info",
                  headers: [
                    "Entry Time",
                    "Strategy Name",
                    "Position Side",
                    "Entry Price",
                    "PNL",
                    "Trade Length",
                    "Secure Length",
                  ],
                  rows: [
                    [
                      getDate(position.startTime).dateString,
                      position.stgName,
                      position.positionSide,
                      position.entryPriceUSDT.toFixed(4),
                      formatPercent(position.pnl),
                      position.tradeLength.toFixed(0),
                      position.secureLength?.toFixed(0) || "N/A",
                    ],
                  ],
                })}
                <div  style="display:flex; gap:10px"; justify-content:center; width:100%>
                    ${Anchor({
                      disabled: positionsIndex === 0,
                      label: "Prev",
                      href: Link({
                        page: "positions",
                        sl,
                        tpSlRatio,
                        maxTradeLength,
                        timeFrame,
                        pair,
                        positionsIndex: positionsIndex - 1,
                      }),
                    })}
                    <span>
                        ${positionsIndex}
                    </span>
                    ${Anchor({
                      disabled: positionsIndex === positionsAcc.length,
                      label: "Next",
                      href: Link({
                        page: "positions",
                        sl,
                        tpSlRatio,
                        maxTradeLength,
                        timeFrame,
                        pair,
                        positionsIndex: positionsIndex + 1,
                      }),
                    })}
                </div>
                    <div style="width:100%; height: 400px;">
                        <h2>Position Chart - ${pair}</h2>
                        <div id="chart"></div>
                    </div>
                    
                    ${Table({
                      title: "Positions Acc",
                      headers: [
                        "#",
                        "Date",
                        "Position Side",
                        "Pair",
                        "PNL",
                        "Acc PNL",
                        "PNL in USDT",
                        "Balance",
                        "Trade Length",
                      ],
                      rows: pnlArray.map((p, index) => [
                        Anchor({
                          label: index.toFixed(),
                          href: Link({
                            page: "positions",
                            sl,
                            tpSlRatio,
                            maxTradeLength,
                            timeFrame,
                            pair: p.pair,
                            positionsIndex: index,
                          }),
                        }),

                        p.date,
                        p.side,
                        Anchor({
                          label: p.pair,
                          href: Link({
                            page: "stats",
                            sl,
                            tpSlRatio,
                            maxTradeLength,
                            timeFrame,
                            pair: p.pair,
                          }),
                        }),
                        formatPercent(p.pnlPt),
                        formatPercent(p.accPnlPt),
                        p.pnlUsdt.toFixed(2),
                        p.balance.toFixed(2),
                        p.len,
                      ]),
                    })}
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
