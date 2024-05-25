import cliProgress from "cli-progress";
import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import type { Strategy } from "../../models/Strategy";
import { statsSnapBT, type StatsSnapBT } from "../../schema";
import { snapshot } from ".";
import { chosenStrategies } from "../../strategies";

type SaveStatsResultsProps = {
	slArray: number[];
	tpArray: number[];
	maxTradeLengthArray: number[];
	strategies: Strategy[];
};

export const saveSnapStats = async ({
	slArray,
	tpArray,
	maxTradeLengthArray,
	strategies,
}: SaveStatsResultsProps) => {
	console.log(strategies.map((s) => s.stgName).join(", "));
	await db.delete(statsSnapBT);

	const loopSize = slArray.length * tpArray.length * maxTradeLengthArray.length;

	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	progressBar.start(loopSize, 0);

	let loop = 1;
	for (const maxTradeLength of maxTradeLengthArray) {
		for (const tp of slArray) {
			for (const sl of tpArray) {
				InitialParams.defaultSL = sl;
				InitialParams.defaultTP = tp;
				InitialParams.maxTradeLength = maxTradeLength;
				let results: StatsSnapBT[] = [];
				const result = await snapshot({ log: false });
				results.push(result);
				await db.insert(statsSnapBT).values(results);
				loop++;
				progressBar.update(loop);
			}
		}
	}
	progressBar.update(loopSize);
	progressBar.stop();
};

await saveSnapStats({
	slArray: InitialParams.backtestSLArray,
	tpArray: InitialParams.backtestTPArray,
	maxTradeLengthArray: InitialParams.backtestMaxTradeLengthArray,
	strategies: chosenStrategies,
});
