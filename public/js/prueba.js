const fs=require("fs")
const path =require("path")
const os = require("os");
let CloudBagLoc=path.join(os.homedir(), 'CloudBag');

let sesiones=fs.readFileSync(path.join(CloudBagLoc, "Sesions.psw")).toString()
console.log(sesiones.split("|"))