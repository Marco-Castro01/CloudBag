const fs = require('fs')
const os = require('os')
const path = require('path')
let CloudBagLoc=path.join(os.homedir(), 'CloudBag');

exports.extractUsers=()=>{
    let usuarios=fs.readFileSync(path.join(CloudBagLoc, "Password.psw")).toString()
    return usuarios.split("/")
};
exports.extractSesions=()=>{
    let sesiones=fs.readFileSync(path.join(CloudBagLoc, "Sesions.psw")).toString()
    return sesiones.split("|")
}
exports.registSesion=(name)=>{
    var today = new Date();
    fs.appendFileSync(path.join(CloudBagLoc, 'Sesions.psw'), name+";"+today.toLocaleString()+"|")

}