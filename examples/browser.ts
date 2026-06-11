import { DuolingoClient } from "../src";

const client = new DuolingoClient({
  tokenProvider: async () => window.prompt("Paste a Duolingo JWT for this browser session")
});

const me = await client.users.getCurrent();
console.log(me.username);
