export const getDrawdown = ({ pnlArray }: { pnlArray: number[] }) => {
	let maxAccPnl = 0;
	let accPnl = 0;
	let drawdown = 0;
	let badRun = 0;
	let badRunLocal = 0;
	for (let index = 0; index < pnlArray.length; index++) {
		accPnl += Number(pnlArray[index]);
		if (accPnl > maxAccPnl) maxAccPnl = accPnl;
		if (maxAccPnl - accPnl > drawdown) drawdown = maxAccPnl - accPnl;
		if (Number(pnlArray[index]) <= 0) badRunLocal++;
		if (Number(pnlArray[index]) > 0) {
			if (badRunLocal > badRun) badRun = badRunLocal;
			badRunLocal = 0;
		}
	}

	return {
		drawdown,
		badRun,
	};
};
