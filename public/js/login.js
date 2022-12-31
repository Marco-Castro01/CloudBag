const fs = require('fs')
const os = require('os')
const path = require('path')
let CloudBagLoc=path.join(os.homedir(), 'CloudBag');
exports.extractUsers=()=>{
    let usuarios=fs.readFileSync(path.join(CloudBagLoc, "Password.psw")).toString()

    return usuarios.split("/")
}

