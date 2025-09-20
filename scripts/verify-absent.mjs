/*
  verify-absent.mjs
  ND-safe guard that fails the build if forbidden PNG assets return.
  Guard is fail-closed to honour the PROTECT charter.
*/

import { existsSync } from "node:fs";

const tombs = ["img/black-madonna.png"]; // Named ghost: img/black-madonna.png

function findRisen(files){
  return files.filter(path => existsSync(path));
}

const risen = findRisen(tombs);

if (risen.length > 0){
  console.error("PROTECT violation: undead asset(s) present:", risen);
  process.exit(1);
}

console.log("Guard ok — no undead assets detected.");
