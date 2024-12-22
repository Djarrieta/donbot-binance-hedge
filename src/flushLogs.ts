import { LogServiceFirebase } from "./infrastructure/LogServiceFirebase";

const logService = new LogServiceFirebase();

logService.deleteAll();
