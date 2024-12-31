import { backtestConfig, DATA_BASE_NAME } from "../config";
import { StatsDataService } from "../infrastructure/StatsDataService";
import { getAccPositions } from "../utils/getAccPositions";
import { getDate } from "../utils/getDate";

type PairsProps = {
	pair: string;
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
};

export const Pairs = ({ pair, sl, tpSlRatio, maxTradeLength }: PairsProps) => {
	const statsDataService = new StatsDataService({
		databaseName: DATA_BASE_NAME,
		tableName: "STATS_DATA",
	});
	const positions = statsDataService.getPositions({
		column: "positions",
		sl,
		tpSlRatio,
		maxTradeLength,
	});
	const filteredPositions = positions.filter((p) => p.pair === pair);
	const accPositions = getAccPositions({
		positions: filteredPositions,
		interval: backtestConfig.interval,
	});

	const pnlArray: { pnl: number; label: string }[] = [];
	let acc = backtestConfig.balanceUSDT;
	for (let i = 0; i < accPositions.length; i++) {
		const pos = accPositions[i];
		acc = acc * (1 + pos.pnl);
		pnlArray.push({
			pnl: acc,
			label: getDate(pos.startTime).dateString,
		});
	}

	return {
		head: `
            <title>Donbot PNL Graph</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: Arial, sans-serif; }
                #chart-wrapper {
                    width: 100%; 
                    height: 400px; 
                    position: relative;
                }
                canvas {
                    width: 100% !important; 
                    height: 100% !important; 
                }
            </style>
            `,
		body: `
            <body>
                <h1>PNL for ${pair}</h1>

                <div id="chart-wrapper">
                    <canvas id="pnlChart"/>
                </div>
                <table style="width: 50%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f2f2f2; text-align: left;">
                            <th style="padding: 8px; border-bottom: 1px solid #ddd;">Date</th>
                            <th style="padding: 8px; border-bottom: 1px solid #ddd;">PNL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pnlArray
													.map(
														(p) =>
															`<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${
																p.label
															}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.pnl.toFixed(
																2
															)}</td></tr>`
													)
													.join("")}
                    </tbody>
                </table>
                <script>
                    const ctx = document.getElementById('pnlChart').getContext('2d');
                    const pnlChart = new Chart(ctx, {
                        type: 'line', // Change this to 'bar', 'pie', etc., as needed
                        data: {
                            labels: ${JSON.stringify(
															pnlArray.map((p) => p.label)
														)},
                            datasets: [{
                                label: 'SL Values',
                                data: ${JSON.stringify(
																	pnlArray.map((p) => p.pnl)
																)},
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderWidth: 1,
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                        }
                    });
                </script>
            </body>
    `,
	};
};
