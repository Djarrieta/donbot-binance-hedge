import cliProgress from "cli-progress";
import { InitialParams } from "../../InitialParams";
import { db } from "../../db";
import type { Strategy } from "../../models/Strategy";
import { statsSnapBT } from "../../schema";
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
	await db.delete(statsSnapBT);

	const loopSize =
		slArray.length *
		tpArray.length *
		maxTradeLengthArray.length *
		strategies.length;

	const progressBar = new cliProgress.SingleBar(
		{},
		cliProgress.Presets.shades_classic
	);
	progressBar.start(loopSize, 0);

	let loop = 1;
	for (const maxTradeLength of maxTradeLengthArray) {
		for (const tp of slArray) {
			for (const sl of tpArray) {
				for (const strategy of strategies) {
					InitialParams.defaultSL = sl;
					InitialParams.defaultTP = tp;
					InitialParams.maxTradeLength = maxTradeLength;
					const result = await snapshot({ strategy, log: false });

					await db.insert(statsSnapBT).values(result);
					loop++;
					progressBar.update(loop);
				}
			}
		}
	}
	progressBar.update(loopSize);
	progressBar.stop();
};

await saveSnapStats({
	slArray: [InitialParams.defaultSL],
	tpArray: [InitialParams.defaultTP],
	maxTradeLengthArray: [InitialParams.maxTradeLength],
	strategies: chosenStrategies,
});
