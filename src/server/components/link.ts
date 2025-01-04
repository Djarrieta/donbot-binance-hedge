type LinkProps = {
	sl: number;
	tpSlRatio: number;
	maxTradeLength: number;
	recommendedPairs: boolean;
};

export const Link = ({
	sl,
	tpSlRatio,
	maxTradeLength,
	recommendedPairs,
}: LinkProps) =>
	`http://localhost:3000/stats?sl=${sl}&tpSlRatio=${tpSlRatio}&maxTradeLength=${maxTradeLength}&recommendedPairs=${recommendedPairs}`;
