import { Context } from "./models/Context";
import { getSymbolList } from "./services/getSymbolList";
import Binance from "binance-api-node";

const context = await Context.getInstance();

context.symbolList = await getSymbolList();
