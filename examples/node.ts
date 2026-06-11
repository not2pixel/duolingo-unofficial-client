import { DuolingoClient } from "../src";

const token = process.env.DUOLINGO_TOKEN;
const client = new DuolingoClient(token ? { token } : {});

const me = await client.users.getCurrent();
console.log(me.username);
