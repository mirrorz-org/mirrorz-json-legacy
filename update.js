const fs = require("fs");

const config = require("./config/config.json");

const { init, load } = require("./parser/node");
init(config, "mirrorz-json-legacy"); // global.fetch, global.DOMParser, global.Timeout, global.timeout
const parsers = require("./parser/parsers");

const LIST = {
  ...config.mirrors,
  ...Object.fromEntries(config.upstream_parser.map((e) => [e, parsers[e]])),
}

const diff = require("./diff");

async function update(site) {
  filename = './data/' + site + '.json';
  let o
  try {
    o = JSON.parse(fs.readFileSync(filename));
  } catch (e) {
    // fallback to empty one
    o = { site: {}, info: [], mirrors: [] }
  }
  let n = await load(LIST[site]);
  if (n === null)
    return `${site}: fetch failed\n`
  d = diff(o, n)
  if (d !== "") {
    fs.writeFileSync(filename, JSON.stringify(n, null, 2));
    return `${site}: update\n${d}`
  }
  return `${site}: same\n`
}

async function main() {
  for (site in LIST) {
    d = await update(site);
    console.log(d)
  }
  fs.writeFileSync('./data/lastupdate', (new Date).toISOString())
  process.exit(0);
}

main();
