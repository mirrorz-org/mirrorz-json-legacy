const fs = require("fs");

const config = require("./config/config.json");

const { init, load } = require("./parser/node");
init(config, "mirrorz-json-legacy"); // global.fetch, global.DOMParser, global.Timeout, global.timeout
const parsers = require("./parser/parsers");

const custom = require("./mirrorz-d-extension/custom");

const { cernet } = require("./cernet");

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
  // Special update function for cernet
  // must be the last one
  "cernet": cernet,
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
    throw new Error(`${site}: fetch failed`)
  n.info = n.info ?? [] // fix for site without info
  d = diff(o, n)
  if (d !== "") {
    fs.writeFileSync(filename, JSON.stringify(n, null, 2));
    return `${site}: update\n${d}`
  }
  return `${site}: same\n`
}

async function retry_update(site, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await update(site);
    } catch (e) {
      console.log(`${site}: Error: ${e}, retrying...`);
      if (i === retries - 1) {
        throw e;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// In milliseconds (Date object)
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  // get lastsuccess file
  let lastsuccess
  try {
    lastsuccess = JSON.parse(fs.readFileSync('./data/lastsuccess'));
  } catch (e) {
    lastsuccess = {}
  }

  for (site in LIST) {
    d = await retry_update(site).then((d) => {
      lastsuccess[site] = (new Date).toISOString();
      return d;
    }).catch(error => {
      // Remove site file if update failed and it has been failed for over 15 days
      let do_remove = true
      if (site in lastsuccess) {
        let lastsuccess_date = new Date(lastsuccess[site])
        let now = new Date()
        if (now - lastsuccess_date < 15 * DAY) {
          do_remove = false
        }
      }
      if (do_remove)
        fs.unlink('./data/' + site + '.json', (err) => {})
      return `${site}: throws exception ${error}, ${do_remove ? '' : 'not '}removed...\n`
    });
    console.log(d)
  }
  fs.writeFileSync('./data/lastupdate', (new Date).toISOString())
  fs.writeFileSync('./data/lastsuccess', JSON.stringify(lastsuccess, null, 2))
  process.exit(0);
}

main();
