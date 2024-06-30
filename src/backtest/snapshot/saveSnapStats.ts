import cliProgress from "cli-progress";
import { params } from "../../Params";
import { db } from "../../db/db";
import type { Strategy } from "../../strategies/Strategy";
import { statsSnapBT, type StatsSnapBT } from "../../db/schema";
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
		for (const tp of tpArray) {
			for (const sl of slArray) {
				params.defaultSL = sl;
				params.defaultTP = tp;
				params.maxTradeLength = maxTradeLength;
				let results: StatsSnapBT[] = [];
				const result = await snapshot({ log: false });
				result && results.push(result);
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
	slArray: params.backtestSLArray,
	tpArray: params.backtestTPArray,
	maxTradeLengthArray: params.backtestMaxTradeLengthArray,
	strategies: chosenStrategies,
});
