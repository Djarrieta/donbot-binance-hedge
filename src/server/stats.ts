import { backtestConfig, DATA_BASE_NAME } from "../config";
import type { PositionSide } from "../domain/Position";
import { getStats } from "../getStats";
import { StatsDataService } from "../infrastructure/StatsDataService";
import { formatPercent } from "../utils/formatPercent";
import { getAccPositions } from "../utils/getAccPositions";
import { getDate } from "../utils/getDate";
import { Anchor } from "./components/anchor";
import { Table } from "./components/table";

type PairsProps = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
};

export const Stats = ({ sl, tpSlRatio, maxTradeLength }: PairsProps) => {
	const statsDataService = new StatsDataService({
		databaseName: DATA_BASE_NAME,
		tableName: "STATS_DATA",
	});
	const statsList = statsDataService.getStats();
	const positions = statsDataService.getPositions({
		column: "positions",
		sl,
		tpSlRatio,
		maxTradeLength,
	});
	const accPositions = getAccPositions({
		positions: positions,
		interval: backtestConfig.interval,
	});

	const {
		winRate,
		accPnl,
		avPnl,
		avPnlPerDay,
		avPosPerDay,
		badRunMonteCarlo,
		drawdownMonteCarlo,
	} = getStats(accPositions);

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
	for (let i = 0; i < accPositions.length; i++) {
		const pos = accPositions[i];
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
			accPositions.filter((pos) => pos.positionSide === "SHORT").length,
			accPositions.filter((pos) => pos.positionSide === "LONG").length,
		],
	};

	return {
		head: `
            <title>Donbot Stats</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            `,
		body: `
            <body>
				
                <h1>Stats</h1>

                ${Table({
									title: "Parameters",
									rows: [
										["Stop Loss", formatPercent(sl)],
										["Take Profit / Stop Loss Ratio", tpSlRatio.toFixed(0)],
										["Max Trade Length", maxTradeLength.toFixed(0)],
									],
								})}
				<div style="display: flex; flex-direction: column; margin-top: 20px">
						${statsList
							.map((stat) =>
								Anchor({
									label: `Back to stats for SL ${stat.sl}, TP/SL ${stat.tpSlRatio} and max trade length ${stat.maxTradeLength}`,
									href: `http://localhost:3000/stats?sl=${stat.sl}&tpSlRatio=${stat.tpSlRatio}&maxTradeLength=${stat.maxTradeLength}`,
								})
							)
							.join("")}
				</div>


				

                ${Table({
									title: "General Stats",
									headers: ["Stat", "Value"],
									rows: [
										["Win Rate", formatPercent(winRate)],
										["Accumulated PNL", formatPercent(accPnl)],
										["Average PNL", formatPercent(avPnl)],
										["Average PNL per Day", formatPercent(avPnlPerDay)],
										["Average Position per Day", avPosPerDay.toFixed(2)],
										["Bad Run Monte Carlo", badRunMonteCarlo.toFixed(2)],
										["Drawdown Monte Carlo", formatPercent(drawdownMonteCarlo)],
									],
								})}
                


                <div id="chart-wrapper" style="width:100%; height: 400px;">
                    <h2>Accumulated Chart</h2>
                    <canvas id="pnlChart"></canvas>
                </div>

                <div style="width: 100%; margin-top: 70px; ">
                    <h2 >Long Short Chart</h2>
                    <div id="pie-chart-wrapper" style="width: 100%;  ">
                        <canvas id="longShortChart"></canvas>
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
											href: `http://localhost:3000/stats/${p.pair}?sl=${sl}&tpSlRatio=${tpSlRatio}&maxTradeLength=${maxTradeLength}`,
										}),
										formatPercent(p.pnlPt),
										formatPercent(p.accPnlPt),
										p.pnlUsdt.toFixed(2),
										p.balance.toFixed(2),
										p.len,
									]),
								})}
                <script>
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
                </script>

            </body>`,
	};
};
