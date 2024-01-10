import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";

const context = await Context.getInstance();

context.symbolList = await getSymbolList();
console.log(context);
