type CalcSlProps = {
    sl?: number,
    minSlTp: number,
    maxSl: number,
    tpSlRatio: number
}

export const calculateStopLossTakeProfit = ({ sl, minSlTp, maxSl, tpSlRatio }: CalcSlProps) => {
    const calcSl = sl && sl > minSlTp && sl < maxSl ? sl : minSlTp;
    const calcTp = calcSl * tpSlRatio

    return { calcSl, calcTp }
}