// reduce a file for mirrorz-302
// adapted from mirrorz-legacy/generator.js

async function cernet() {
  let config = require("./config/config/mirrors.cernet.edu.cn.json")

  let sites = [];

  config.mirrors_legacy.forEach((abbr) => {
    sites.push(require(`./data/${abbr}.json`));
  });
  for (const abbr in config.mirrors) {
    sites.push(require(`./data/${abbr}.json`));
  }

  // extra
  sites.push(require(`./data/nano.json`));
  sites.push(require(`./data/neo.json`));

  cnames = []
  note = []

  for (const site of sites) {
    if (!("extension" in site && site.extension.includes("D"))) {
      continue;
    }
    note.push(site.site.abbr);
    for (const mirror of site.mirrors) {
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
