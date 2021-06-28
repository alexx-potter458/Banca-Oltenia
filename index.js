const createServerExpress = require('express');
const server = createServerExpress(); // server as object
const path = require("path");
const fs = require('fs');
var fse = require('fs-extra')
const nodemailer = require("nodemailer");
const session = require('express-session');
const sharp = require('sharp');

const formidable = require('formidable');
const crypto = require('crypto');

const serverNetwork = require('ip');
const { Client } = require('pg');
let requestIp = require('request-ip');
let herokuPort = process.env.PORT || 8080;

server.use(session({secret: 'mysecretuser', resave: true, saveUninitialized: false }));

const client = new Client({
    host: 'ec2-54-225-228-142.compute-1.amazonaws.com', user: 'upopbwnaehhuib',
    password: 'bcc08249637396c43f1b55e63fbe68b8cadfa7e8ce80d7210cb18b45b6ceb37e', database: 'dfa2i2emu7diij', port: 5432,
    ssl: { require: true, rejectUnauthorized: false }
});

client.connect();

server.set("view engine", "ejs");

server.get("/src/json/gallery.json", function (req, res) {
    res.status(403).render("pages/page403.ejs");
})

server.use("/src", createServerExpress.static(path.join(__dirname, "src")));


let mainCategories = [];
let secondCategories = new Set();

let queryMainCategories = client.query("select distinct main_category from products", function (err, queryResult) {
    mainCategories = queryResult.rows;
});

let querySecondCategories = client.query("select distinct second_categories from products", function (err, queryResult) {
    for (let row of queryResult.rows) {
        for (let prop of row.second_categories) {
            secondCategories.add(prop);
        }
    }
});

function pictureCheck() {

    let jsonFile = fs.readFileSync("src/json/gallery.json");
    let obj = JSON.parse(jsonFile);
    let galleryPath = obj.myPath;
    let imagesPaths = [];

    for (let img of obj.images) {

        let oldImg = path.join(galleryPath, img.relPath);
        let ext = path.extname(img.relPath);
        let fileName = path.basename(img.relPath, ext);
        let newImg = path.join(galleryPath + "/small/" + fileName + "Small" + ".webp");
        let newImgMed = path.join(galleryPath + "/medium/" + fileName + "Medium" + ".webp");

        let data = new Date();
        let hour = data.getHours();

        if (img.time == "day" && hour >= 12 & hour <= 20)
            imagesPaths.push({ normal: oldImg, small: newImg, medium: newImgMed, description: img.description, license: img.license, link: img.licenseLink, name: fileName });
        else
            if (img.time == "morning" && hour > 5 && hour < 12)
                imagesPaths.push({ normal: oldImg, small: newImg, medium: newImgMed, description: img.description, license: img.license, link: img.licenseLink });
            else
                if (img.time == "night" && ((hour > 20 && hour <= 23) || (hour >= 0 && hour <= 5)))
                    imagesPaths.push({ normal: oldImg, small: newImg, medium: newImgMed, description: img.description, license: img.license, link: img.licenseLink });

        if (!fs.existsSync(newImg)) {
            sharp(oldImg)
                .resize(150)
                .toFile(newImg, function (err) {
                    console.log("can't convert ", oldImg, " to ", newImg, err);
                });
        }
        if (!fs.existsSync(newImgMed)) {
            sharp(oldImg)
                .resize(200)
                .toFile(newImgMed, function (err) {
                    console.log("can't convert ", oldImg, " to ", newImgMed, err);
                });
        }
    }

    return imagesPaths;

}


async function sendEmail(firstname, lastname, username, email){
	var transp= nodemailer.createTransport({
		service: "gmail",
		secure: false,
		auth:{//date login 
			user:"proiect.tehniciweb21@gmail.com",
			pass:"proiecttw"
		},
		tls:{
			rejectUnauthorized:false
		}
	});
	await transp.sendMail({
		from:"Banca Oltenia",
		to:email,
		subject:"Te-ai inregistrat cu succes",
		text:"Username-ul tau este "+username,
		html:"<h1>Buenos dias mi amore <i>" + firstname + " " + lastname +"</i> </h1><p>Username-ul tau este  <b>"+ username +"</b> </p><br>" + "<p>Hai la noi pe site: <a href='https://bancaoltenia-site.herokuapp.com/'>Banca Oltenia</p>"
	})

}

let cryptoSalt = 'mysecretpassword';

server.post("/registerResult", function (req, res) {

    let username;
    let formular = formidable.IncomingForm();

    formular.parse(req, function (err, fields, file) {

        username = fields.username.toLowerCase();

        if (username === '' || !username.match(/((^[A-Za-z]{1})+([A-Za-z0-9]{0,5}))+([0-9]{4})$/gm) ||
            !fields.lastname.match(/(^[A-Z]{1})+([A-Za-z]{2,50})/gm) || !fields.firstname.match(/(^[A-Z]{1})+([A-Za-z]{2,50})/gm) ||
            !fields.password.match(/(([A-Za-z]{0,20})+(([A-Z]{1,3})+([A-Za-z]{0,20})))/gm)) {
            console.log("'" + username + "'");

            res.render("pages/register.ejs", { mainCategories: mainCategories, registerError: '(Ai introdus date gresit.)' });
        }
        else {
            client.query(`select count(*) from users where username='${username}';`, function (err, value) {

                let userExists = value.rows[0].count;
                if (userExists == 1) {
                    res.render("pages/register.ejs", { mainCategories: mainCategories, registerError: '(Userul deja exista. Incearca altceva)' });
                }
                else {
                    
                    let encryptedPassword = crypto.scryptSync(fields.password, cryptoSalt, 20).toString('ascii')
                    let now = new Date();
                    let registerDate = (now.getMonth() + '-' + now.getDate() + '-' + now.getFullYear());
                    let darkThemeEanbled = false;
                    if (fields.theme == 'dark')
                        darkThemeEanbled = true;

                    let pictureExists = false;
                    let userPicturePath;
                    if (file.profilePic.name == '')
                        userPicturePath = 'src/images/users/default_pic.jpg';
                    else {
                        userPicturePath = 'src/images/users/' + username + path.extname(file.profilePic.name);
                        pictureExists = true;

                    }

                    let userInsertQuery = `insert into users(username, first_name, last_name, email, register_date, theme, img, role, password) values ('${username}', '${fields.firstname}', '${fields.lastname}', '${fields.email}', '${registerDate}', ${darkThemeEanbled}, '${userPicturePath}', 'basic', '${encryptedPassword}')`;
                    client.query(userInsertQuery, function (err, result){});

                    if (pictureExists == true) {
                        let oldpath = file.profilePic.path;
                        let userPictureServerPath = path.join(__dirname + "/src/images/users/" + username + '_pic' + path.extname(file.profilePic.name));                
                        fse.move(oldpath, userPictureServerPath, function(err){})
                    }
                    sendEmail(fields.firstname, fields.lastname, username, fields.email)
                    console.log(encryptedPassword);
                    res.redirect("/index");
                }
            });
        }



    });


});

server.post("/loginResult", function (req, res) {

    let formular = formidable.IncomingForm();

    formular.parse(req, function (err, fields) {
        let encryptedPassword = crypto.scryptSync(fields.password, cryptoSalt, 20).toString('ascii');
        let loginQuery= `select id, username, last_name, first_name, email, theme, register_date, img, role from users where username= $1::text and password=$2::text`;
        client.query(loginQuery, [fields.username, encryptedPassword], function(err, res){
            if(!err) {
                
                if (res.rows.length == 1){
                    req.session.user={
                        id:res.rows[0].id,
                        username:res.rows[0].username,
                        firstName:res.rows[0].first_name,
                        lastName:res.rows[0].last_name,
                        email:res.rows[0].email,
                        theme:res.rows[0].theme,
						role:res.rows[0].role,
                        img: res.rows[0].img
                    }
                }
            }
            else{

            }
        });

    })
    console.log(req.session);
    res.redirect('/index');

});

server.get(["/", "/index"], function (req, res) {

    console.log("user in index");
    let userIp = requestIp.getClientIp(req);

    


    let galleryPaths = pictureCheck();
console.log(req.session.user);
    const result = client.query("select * from products where special = true", function (err, queryResult) {
        res.render("pages/index.ejs", { mainCategories: mainCategories, userIp: userIp, images: galleryPaths, products: queryResult.rows });
    });
});

server.get("/galerie", function (req, res) {

    let galleryPaths = pictureCheck();
    res.render("pages/galerie.ejs", { mainCategories: mainCategories, images: galleryPaths });
    console.log("user in galerie");
});

server.get("/produse", function (req, res) {
    client.query("select * from products", function (err, queryResult) {
        res.render("pages/produse.ejs", { mainCategories: mainCategories, secondCategories: secondCategories, products: queryResult.rows, mainCategory: req.query.mainCategory });
        console.log("user in produse");
    });
});

server.get("/produs/:id_prod", function (req, res) {
    console.log("user in" + req.url);

    const result = client.query("select * from products where id=" + req.params.id_prod, function (err, queryResult) {
        res.render("pages/produs.ejs", { mainCategories: mainCategories, products: queryResult.rows });
    });
});

server.get("/*", function (req, res) {
    console.log("user in " + req.url);
    res.render("pages" + req.url + ".ejs", { mainCategories: mainCategories, registerError: '' }, function (err, renderResult) {
        if (err) {
            if (err.message.includes("Failed to lookup view")) {
                res.status(404).render("pages/page404.ejs");
            } else
                throw err;
        } else
            res.send(renderResult);
    });
});

server.listen(herokuPort);
console.log("Am pornit serverul");