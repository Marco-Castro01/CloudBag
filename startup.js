const pkg = require('pkg')
const readline = require('readline-sync')
const fs = require('fs')
const os = require('os')
const path = require('path')
const express = require("express");
const ejs = require('ejs')
const parser = require("body-parser");
const formidable = require('formidable');
const colors = require('colors');
const users=require("./public/js/login");
const CloudBagLoc = path.join(os.homedir(), 'CloudBag');
console.log(CloudBagLoc);
const port = 3000;
let userData={
    NickName:null,
    password:null,
    rango:null
};
let LoggedIn;
let UserWish;

PrintCloudBagDrop()
StartUp()

function PrintCloudBagDrop(){
    console.clear()
    console.log('CloudBag\n'.cyan.bold)
}

function StartUp() {
    console.log("What do you want to do?".italic)
    console.log("    1. Start CloudBag.")
    console.log("    2. Change Password.\n")
    console.log(CloudBagLoc);
    
    if(!fs.existsSync(CloudBagLoc))
        fs.mkdir(CloudBagLoc, ()=>{})
        
    if(!fs.existsSync(path.join(CloudBagLoc, 'CloudBag')))
        fs.mkdir(path.join(CloudBagLoc, 'CloudBag'), ()=>{})

    if (!fs.existsSync(path.join(CloudBagLoc, 'Password.psw')))
        fs.writeFileSync(path.join(CloudBagLoc, 'Password.psw'), 'hola;admin;creador/probando;prueba;usuario/Marco;mark;administrador')

    while (true) {
        UserWish = parseInt(readline.question("Please enter 1 or 2: "));
        if ([1, 2].includes(UserWish)) {
            Initialize(UserWish)
            break
        } else {
            console.log("The entered input should be 1 or 2 only")
        }
    }
}

function Initialize(UserWish){
    if (UserWish == 1){
        StartServer()
    }else if (UserWish == 2){
        ChangePassword()
    }
}

function ChangePassword(){
    PrintCloudBagDrop()
    let oldPassowrd = readline.question('Enter old Password: ')
    let realOldPassword = fs.readFileSync(path.join(CloudBagLoc, 'password.psw'))
    let password;

    if (oldPassowrd == realOldPassword) {
        password = readline.question('Enter New Password: ')
        let confirmPassword = readline.question('Confirm Password: ');
        while (password != confirmPassword) {
            console.log('Entered passwords do not match')

            PrintCloudBagDrop()
            password = readline.question('Enter password: ')
            confirmPassword = readline.question('Confirm Password: ')
        }
        fs.writeFile(path.join(CloudBagLoc, 'password.psw'), password, ()=>{})

        console.log('Password changed successfully')
        readline.question('\nPress Enter...'.red)
        Reset()
    }else{
        console.log('Entered Password is incorrect')
        readline.question('\nPress Enter...'.red)
        Reset()
    }
}

function Reset(){
    console.clear()
    StartUp()
}

function StartServer(){
    const saveLocation = CloudBagLoc

    const app = express();

    let password; //= fs.readFileSync(path.join(CloudBagLoc, "Password.psw"));
    let isPasswordIncorrect = 0;
    let clients = [];
    LoggedIn = {};
    let ip_address;

    app.use(express.static(path.join(__dirname ,'/public')))
    app.use(express.static(path.join(__dirname ,'/SVGs')))
    app.use(express.static(path.join(__dirname ,'/views')))
    app.use(express.static(path.join(CloudBagLoc, 'CloudBag')))
    app.use(parser.urlencoded({ extended: false }))

    app.set('view engine', 'ejs')

    // GET /////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.get("/", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn[clientIp] && userData.NickName!=null && userData.password!=null){
            res.render(path.join(__dirname ,'/views/pages/Home'))
        }else {
            res.redirect('/Login')
        }
    })

    app.get("/Login", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]
        if (LoggedIn[clientIp] && userData.NickName!=null && userData.password!=null){
            res.redirect('/')
        }else {
            res.render(path.join(__dirname ,'/views/pages/login'))
        }
    })

    app.get("/GetFromPC", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn[clientIp]  && userData.NickName!=null && userData.password!=null ) {
            let CloudBagFiles = walk(path.join(CloudBagLoc, 'CloudBag'))
            res.render(path.join(__dirname ,'/views/pages/GetFromPC'), {
                CloudBagFiles: CloudBagFiles,
            })
        }else{
            res.redirect('/Login')
        }
    })


    app.get("/SendToCloudBag", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]

        if (LoggedIn[clientIp]  && userData.NickName!=null && userData.password!=null ) {
            res.render(path.join(__dirname ,'/views/pages/SendToCloudBag'))
        }else{
            res.redirect('/Login')
        }
    })

    app.get('/Logout', (req, res)=>{

        let clientIp = req.ip;
        LoggedIn[clientIp] = false;

        res.redirect('/')
    })

    // POST ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.post("/Login", (req, res)=>{
        let clientIp = CheckClient(req, clients, LoggedIn)[0]
        clients = CheckClient(req, clients, LoggedIn)[1]
        LoggedIn = CheckClient(req, clients, LoggedIn)[2]
        let nickName=req.body.nickName;
        let EnteredPassword = req.body.Password;
        validateUser(nickName,EnteredPassword);
        console.log("probando")
        if (userData.NickName!=null && userData.password!=null && userData.rango!=null ){
            console.log("probando2")
            isPasswordIncorrect = false;
            LoggedIn[clientIp] = true;
            res.redirect('/')
        }else{
            res.redirect('/Login')
            isPasswordIncorrect = true;
        }

    })



     app.post("/SendData", (req, res, next)=>{
        const form = formidable();

        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }

            fs.mkdir(path.join(saveLocation, fields.BatchName), ()=>{})

            console.log("\nFiles saved at:")

            let fileCounter=0;
            for(let file in files){
                fileCounter++
            }

            let fileCounter2=0;
            for (let file in files){
                fileCounter2++
                let tempPath = files[file]["filepath"];
                let newPath = path.join(saveLocation, fields.BatchName, files[file]["originalFilename"])

                fs.rename(tempPath, newPath, ()=>{});

                if (fileCounter2<fileCounter) {
                    console.log("    "+newPath.green.bold);
                }
            }

            res.redirect('/')
        });
    })

    app.post("/SendDataToCloudBag", (req, res, next)=>{
        const CloudBagLocation = path.join(CloudBagLoc, 'CloudBag')

        const form = formidable();

        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }

            fs.mkdir(path.join(CloudBagLocation, fields.BatchName), ()=>{})

            console.log("\nFiles saved to CloudBag: ")

            let fileCounter=0;
            for(let file in files){
                fileCounter++
            }

            let fileCounter2=0;
            for (let file in files){
                fileCounter2++
                let tempPath = files[file]["filepath"];
                let newPath = path.join(CloudBagLocation, fields.BatchName, files[file]["originalFilename"])

                fs.rename(tempPath, newPath, ()=>{});

                if (fileCounter2<fileCounter) {
                    console.log("    "+newPath.green.bold);
                }
            }

            res.redirect('/');
        });
    })

    // SERVER //////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.listen(port, ()=>{

        var address,
        ifaces = require('os').networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
        }

        PrintCloudBagDrop()
        PrintInstructions()

        console.log("Goto " + ("http://" + address + ":" + port.toString() + "/").cyan.bold.underline + " in any web browser")
        console.log("in your phone or any other device to use CloudBagDrop.")
    })
}

// CUSTOM FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////////////////

function validateUser(nick,pass){
    users.extractUsers().forEach(
        (user)=>{
            if((user.split(";")[0]==nick) && (user.split(";")[1]==pass)){
                userData.NickName=nick;
                userData.password=pass;
                userData.rango=user.split(";")[2]

                console.log(user)

            }

        }

    )
}
function CheckClient(request, clients, isLoggedIn){
    let clientIp = request.ip;

    if (!clients.includes(clientIp)) {
        clients.push(clientIp)
        isLoggedIn[clientIp] = false
    };

    return [clientIp, clients, isLoggedIn]
}

function walk(walkPath){
    let CloudBagContents = fs.readdirSync(walkPath)
    let BetterContents = {}
    let FileContents = []

    CloudBagContents.forEach((Content)=>{
        let ContentPath = path.join(walkPath, Content)
        let stat = fs.statSync(ContentPath)

        if (stat.isDirectory()){
            let SubContents = walk(path.join(walkPath, Content))
            FileContents.push(SubContents)
        }else{
            FileContents.push(Content)
        }
    })

    BetterContents[walkPath.split('\\').pop().split('/').pop()] = FileContents

    return BetterContents
}

function PrintInstructions(){
    console.log("CloudBagDROP INSTRUCTIONS".bold)
    console.log("\nGeneral Instructions")
    console.log("1. Please ensure that both the devices are connected\n   to the same network (i.e. Wi-Fi, Hotspot, etc)".yellow.bold)
    console.log("2. Do not use Ctrl+C for copying link, it will stop CloudBagDrop.".yellow.bold)
    console.log("\nSending Files from other devices to this PC")
    console.log("1. Goto CloudBagDrop using the link below on other devices.".yellow.bold)
    console.log("2. Then click on".yellow.bold + " SEND FILES FROM PHONE/NON-SERVER PC TO SERVER PC".yellow)
    console.log("3. Now send the Files.")
    console.log("\nSending Files from this PC to other devices")
    console.log("1. Goto CloudBagDrop using the link below on this PC and other devices.".yellow.bold)
    console.log("2. Then click on".yellow.bold + " SEND FILES FROM THE SERVER PC CloudBag".yellow)
    console.log("3. Now on other devices click on".yellow.bold + " GET FILES FROM CloudBag".yellow)
    console.log("4. Select open The folder and download the File/Photo on other device\n".yellow.bold)
}