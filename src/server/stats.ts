import { backtestConfig } from "../config";
import type { PositionSide } from "../domain/Position";
import { formatPercent } from "../utils/formatPercent";
import { getDate } from "../utils/getDate";
import { Anchor } from "./components/anchor";
import { Link } from "./components/link.ts";
import { Select } from "./components/select";
import { Table } from "./components/table";
import { getPositionsList, type GetPositionsListProps } from "./utils.ts";

export const Stats = ({
  sl,
  tpSlRatio,
  maxTradeLength,
  timeFrame,
  pair = "All",
}: GetPositionsListProps) => {
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
    positions,
    statsList,
  } = getPositionsList({
    sl,
    tpSlRatio,
    maxTradeLength,
    timeFrame,
    pair,
    maxProtectedPositions: backtestConfig.maxProtectedPositions,
  });

  const symbolList = Array.from(new Set(positions.map((p) => p.pair)))
    .map((s) => {
      return {
        pair: s,
        value: positions.filter((p) => p.pair === s).length,
      };
    })
    .sort((a, b) => b.value - a.value);

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

  const pieChartData = {
    labels: ["Shorts", "Longs"],
    data: [
      positions.filter((pos) => pos.positionSide === "SHORT").length,
      positions.filter((pos) => pos.positionSide === "LONG").length,
    ],
  };

  return {
    head: `
            <title>Donbot Stats</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            `,
    body: `
            <body>
				<div style="display:flex; gap: 4px;">
					${Select({
            options: statsList.map((s) => {
              return {
                label: `SL: ${s.sl} TP/SL: ${s.tpSlRatio} MaxLen: ${s.maxTradeLength}`,
                value: Link({
                  sl: s.sl,
                  tpSlRatio: s.tpSlRatio,
                  maxTradeLength: s.maxTradeLength,
                  timeFrame,
                  pair,
                }),
              };
            }),
            selected: Link({
              sl,
              tpSlRatio,
              maxTradeLength,
              timeFrame,
              pair,
            }),
          })}
					${Select({
            options: [
              {
                label: "Backtest",
                value: Link({
                  sl,
                  tpSlRatio,
                  maxTradeLength,
                  timeFrame: "Backtest",
                  pair,
                }),
              },
              {
                label: "Forwardtest",
                value: Link({
                  sl,
                  tpSlRatio,
                  maxTradeLength,
                  timeFrame: "Forwardtest",
                  pair,
                }),
              },
              {
                label: "All Time",
                value: Link({
                  sl,
                  tpSlRatio,
                  maxTradeLength,
                  timeFrame: "All",
                  pair,
                }),
              },
            ],
            selected: Link({
              sl,
              tpSlRatio,
              maxTradeLength,
              timeFrame,
              pair,
            }),
          })}
					${Select({
            options: [
              {
                label: "Winning Pairs",
                value: Link({
                  sl,
                  tpSlRatio,
                  maxTradeLength,
                  timeFrame,
                  pair: "Winning",
                }),
              },
              {
                label: "All Pairs",
                value: Link({
                  sl,
                  tpSlRatio,
                  maxTradeLength,
                  timeFrame,
                  pair: "All",
                }),
              },
              ...symbolList.map((s) => {
                return {
                  label: `${s.pair}`,
                  value: Link({
                    sl,
                    tpSlRatio,
                    maxTradeLength,
                    timeFrame,
                    pair: s.pair,
                  }),
                };
              }),
            ],
            selected: Link({
              sl,
              tpSlRatio,
              maxTradeLength,
              timeFrame,
              pair,
            }),
          })}
				</div>
				
                ${Table({
                  title: "General Stats",
                  headers: ["Stat", "Value"],
                  rows: [
                    ["Start Date", getDate(start).dateString],
                    ["Final Date", getDate(end).dateString],
                    ["Total Days", (totalDays || 0).toFixed()],
                    ["Positions", positions.length.toFixed()],
                    ["Positions Accumulated", positionsAcc.length.toFixed()],
                    ["Win Rate", formatPercent(winRate)],
                    ["Win Rate Accumulated", formatPercent(winRateAcc)],
                    ["Accumulated PNL", formatPercent(accPnlAcc)],
                    ["Average PNL", formatPercent(avPnl)],
                    ["Average PNL Accumulated", formatPercent(avPnlAcc)],
                    ["Average PNL per Day", formatPercent(avPnlPerDay)],
                    ["Average Position per Day", avPosPerDay.toFixed(2)],
                    ["Bad Run Accumulated", badRunAcc?.toFixed() || "-"],
                    [
                      "Bad Run Monte Carlo",
                      badRunMonteCarloAcc?.toFixed() || "-",
                    ],
                    ["Drawdown Accumulated", formatPercent(drawdownAcc || 0)],
                    [
                      "Drawdown Monte Carlo",
                      formatPercent(drawdownMonteCarloAcc),
                    ],
                    ["Sharpe Ratio", sharpeRatio.toFixed(2)],
                  ],
                })}

		${
      backtestConfig.breakEventAlerts.length
        ? Table({
            title: "Break Event",
            headers: ["Trigger", "Break", "Min Length"],
            rows: backtestConfig.breakEventAlerts.map((be) => [
              formatPercent(be.trigger),
              formatPercent(be.break),
              be.minLength.toFixed(),
            ]),
          })
        : ""
    }
                
				<div style="width:100%; display:flex; gap: 70px; flex-direction:column">
					<div style="width:100%; height: 400px;">
						<h2>Accumulated Chart</h2>
						<canvas id="pnlChart"></canvas>
					</div>

					${
            symbolList.length > 1
              ? `
					<div style="width:100%; ">
						<h2>Positions per Symbol</h2>
						<canvas id="positionsPerSymbolBarChart"></canvas>
						<details>
							<summary>Pair List</summary>
							<pre>${JSON.stringify(
                symbolList.map((s) => s.pair),
                null,
                2
              )}</pre>
						</details>
						
					</div>`
              : ""
          }

					<div style="width: 100%;  ">
						<h2 >Long Short Chart</h2>
						<div id="pie-chart-wrapper" style="width: 100%;  ">
							<canvas id="longShortChart"></canvas>
						</div>
					</div>
					
				</div>
        <h2>Postions </h2>
        <div style="display: flex; gap: 4px; flex-wrap: wrap">
            <div style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px">
              ${Anchor({
                label: "See positions for " + pair,
                href: Link({
                  page: "positions",
                  sl,
                  tpSlRatio,
                  maxTradeLength,
                  timeFrame,
                  pair,
                }),
              })}
            </div>
            ${
              symbolList.length > 1
                ? symbolList.map(
                    (
                      s
                    ) => ` <div style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px">
                ${Anchor({
                  label: s.pair,
                  href: Link({
                    page: "positions",
                    sl,
                    tpSlRatio,
                    maxTradeLength,
                    timeFrame,
                    pair: s.pair,
                  }),
                })}
              </div>`
                  )
                : ""
            }
          
          </div>

        
  
          
                <script>
					// Line Chart
                    const ctx = document.getElementById('pnlChart').getContext('2d');
                    const pnlChart = new Chart(ctx, {
                        type: 'line', 
                        data: {
                            labels: ${JSON.stringify(
                              pnlArray.map((p) => p.date)
                            )},
                            datasets: [{
                                label: 'Balance',
                                data: ${JSON.stringify(
                                  pnlArray.map((p) => p.balance)
                                )},
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: "white",
                                borderWidth: 1,
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                        }
                    });

                    // Pie Chart
                    const pieCtx = document.getElementById('longShortChart').getContext('2d');
                    const longShortChart = new Chart(pieCtx, {
                        type: 'pie',
                        data: {
                            labels: ${JSON.stringify(pieChartData.labels)},
                            datasets: [{
                                label: 'Short/Long Distribution',
                                data: ${JSON.stringify(pieChartData.data)},
                                backgroundColor:[ 'rgba(255,99,132,0.6)','rgba(75,192,192,0.6)'],
                                hoverBackgroundColor:[ 'rgba(255,99,132,0.8)', 'rgba(75,192,192,0.8)']
                            }]
                        },
                        options:{
                            responsive:true,
                            maintainAspectRatio:false
                        }
                    });

					//Bar Chart for positions per pair
					const barCtx = document.getElementById('positionsPerSymbolBarChart').getContext('2d');
					const positionsPerSymbolBarChart= new Chart(barCtx, {
						type: 'bar',
						data: {
							labels: ${JSON.stringify(symbolList.map((p) => p.pair))},
							datasets: [{
								label: 'Positions per Symbol',
								data: ${JSON.stringify(symbolList.map((p) => p.value))},
							}]
						}
					})
					
                </script>

            </body>`,
  };
};
