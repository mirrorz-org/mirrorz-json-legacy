const fs = require("fs");
const path = require("path");

// reduce a file for mirrorz-302
// adapted from mirrorz-legacy/generator.js

function redirectAbbrs() {
  const sitesDir = path.join(__dirname, "config", "sites");
  return new Set(
    fs.readdirSync(sitesDir).flatMap((site) => {
      const filename = path.join(sitesDir, site, "config.json");
      if (!fs.existsSync(filename)) return [];
      return require(filename).abbrs;
    }),
  );
}

async function cernet() {
  let config = require("./config/config/mirrors.cernet.edu.cn.json")

  let sites = [];

  for (const abbr of config.mirrors) {
    try {
      sites.push(require(`./data/${abbr}.json`));
    } catch (e) {
      console.log(`Error: ${abbr} not found`);
    }
  }

  cnames = []
  note = []

  cnames_noredir = [
    "AOSP",
    "CocoaPods",
    "homebrew",
    "pybombs",
    "anaconda",
    "gentoo",
  ]

  const configuredAbbrs = redirectAbbrs();
  for (const site of sites) {
    if (!configuredAbbrs.has(site.site.abbr)) {
      continue;
    }
    note.push(site.site.abbr);
    for (const mirror of site.mirrors) {
      if (cnames_noredir.includes(mirror.cname)) {
        continue;
      }
      if (!cnames.includes(mirror.cname)) {
        cnames.push(mirror.cname);
      }
    }
  }

  cernet = {
    site: {
      abbr: "CERNET",
      url: config.url,
      name: "校园网联合镜像站（mirrorz-302 智能选择）",
      note: note.toString(),
    },
    info: [],
    mirrors: [],
  };

  for (const cname of cnames) {
    cernet.mirrors.push({
      cname,
      url: "/" + cname,
      status: "U",
    })
  }

  return cernet;
}

module.exports = { cernet };
