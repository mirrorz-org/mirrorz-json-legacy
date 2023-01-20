const fs = require("fs");

const config = require("./config/config.json");

const { init, load } = require("./parser/node");
init(config, "mirrorz-json-legacy"); // global.fetch, global.DOMParser, global.Timeout, global.timeout
const parsers = require("./parser/parsers");

const custom = require("./mirrorz-d-extension/custom");

function parsers_customized(e) {
  if (e in custom) {
    return async () => custom[e](await load(parsers[e]));
  }
  else {
    return parsers[e];
  }
}

const LIST = {
  // FIXME: should also patch config.mirrors with config.d_mirrors
  ...config.mirrors,
  ...Object.fromEntries(config.upstream_parser.map((e) => [e, parsers_customized(e)])),
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
  n.info = n.info ?? [] // fix for site without info
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
