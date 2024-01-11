import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import { updateSymbolList } from "./services/updateSymbolList";

await updateSymbolList();

const context = await Context.getInstance();
context.symbolList = await getSymbolList();
console.log(context.symbolList);
