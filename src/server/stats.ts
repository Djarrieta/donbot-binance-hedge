import { backtestConfig, DATA_BASE_NAME, strategies } from "../config";
import type { PositionSide } from "../domain/Position";
import { getStats } from "../getStats";
import { StatsDataService } from "../infrastructure/StatsDataService";
import { formatPercent } from "../utils/formatPercent";
import { getAccPositions } from "../utils/getAccPositions";
import { getDate } from "../utils/getDate";
import { getWinningPairs } from "../utils/getWinningPairs.ts";
import { Anchor } from "./components/anchor";
import { Link } from "./components/link.ts";
import { Select } from "./components/select";
import { Table } from "./components/table";

export type TimeFrame = "Backtest" | "Forwardtest" | "All";
type PairsProps = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
	timeFrame: TimeFrame;
	pair: "All" | "Winning" | string;
};

export const Stats = ({
	sl,
	tpSlRatio,
	maxTradeLength,
	timeFrame,
	pair = "All",
}: PairsProps) => {
	const statsDataService = new StatsDataService({
		databaseName: DATA_BASE_NAME,
		tableName: "STATS_DATA",
	});
	const statsList = statsDataService.getStats();

	let positions = statsDataService.getPositions({
		column: "positions",
		sl,
		tpSlRatio,
		maxTradeLength,
	});

	//TimeFrame filter
	if (timeFrame === "Backtest") {
		positions = positions.filter(
			(p) => p.startTime <= backtestConfig.backtestEnd
		);
	} else if (timeFrame === "Forwardtest") {
		positions = positions.filter(
			(p) => p.startTime > backtestConfig.backtestEnd
		);
	}

	//Pair filter
	const pairsInStrategies = Array.from(
		new Set(strategies.map((s) => s.allowedPairs).flat())
	);
	if (pairsInStrategies.length) {
		positions = positions.filter((p) => pairsInStrategies.includes(p.pair));
	}
	if (pair && pair !== "All" && pair !== "Winning") {
		positions = positions.filter((p) => p.pair === pair);
	} else if (pair === "Winning") {
		const winningPairs = getWinningPairs({
			positions,
			pairList: Array.from(new Set(positions.map((p) => p.pair))),
			interval: backtestConfig.interval,
		});

		positions = positions.filter((p) => winningPairs.includes(p.pair));
	}

	positions = getAccPositions({
		positions: positions,
		interval: backtestConfig.interval,
	});

	const symbolList = Array.from(new Set(positions.map((p) => p.pair)))
		.map((s) => {
			return {
				pair: s,
				value: positions.filter((p) => p.pair === s).length,
			};
		})
		.sort((a, b) => b.value - a.value);

	const {
		winRate,
		accPnl,
		avPnl,
		avPnlPerDay,
		avPosPerDay,
		badRunMonteCarlo,
		drawdownMonteCarlo,
	} = getStats(positions);

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
	for (let i = 0; i < positions.length; i++) {
		const pos = positions[i];
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
										["Positions", positions.length.toFixed()],
										["Win Rate", formatPercent(winRate)],
										["Accumulated PNL", formatPercent(accPnl)],
										["Average PNL", formatPercent(avPnl)],
										["Average PNL per Day", formatPercent(avPnlPerDay)],
										["Average Position per Day", avPosPerDay.toFixed(2)],
										["Bad Run Monte Carlo", badRunMonteCarlo.toFixed()],
										["Drawdown Monte Carlo", formatPercent(drawdownMonteCarlo)],
									],
								})}
                
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

                ${Table({
									title: "Positions",
									headers: [
										"Date",
										"Position Side",
										"Pair",
										"PNL",
										"Acc PNL",
										"PNL in USDT",
										"Balance",
										"Trade Length",
									],
									rows: pnlArray.map((p) => [
										p.date,
										p.side,
										Anchor({
											label: p.pair,
											href: Link({
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
