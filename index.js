const createServerExpress = require('express');
const server = createServerExpress(); // server as object
const path = require("path");
const fs = require('fs');
const sharp = require('sharp');
const serverNetwork = require('ip');
const { Client } = require('pg');
let requestIp = require('request-ip');
let herokuPort = process.env.PORT || 8080

let users = 0

const client = new Client({
    host: 'ec2-54-225-228-142.compute-1.amazonaws.com', user: 'upopbwnaehhuib',
    password: 'bcc08249637396c43f1b55e63fbe68b8cadfa7e8ce80d7210cb18b45b6ceb37e', database: 'dfa2i2emu7diij', port: 5432, 
    ssl: {require: true, rejectUnauthorized: false}
});


client.connect();

server.set("view engine", "ejs");

server.get("/src/json/gallery.json", function (req, res) {
    res.status(403).render("pages/page403.ejs");
})

server.use("/src", createServerExpress.static(path.join(__dirname, "src")));


let mainCategories = [];
let secondCategories = new Set();

let queryMainCategories = client.query("select distinct main_category from products", function (err, queryResult){
    mainCategories = queryResult.rows;
});

let querySecondCategories = client.query("select distinct second_categories from products", function (err, queryResult){
    for(let row of queryResult.rows) {
        for(let prop of row.second_categories) {
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

server.get("/", function (req, res) {
    users += 1;
    let userIp = requestIp.getClientIp(req);
    console.log("Clicks: " + users);
    let galleryPaths = pictureCheck();
    const result = client.query("select * from products where special = true", function (err, queryResult) {
        res.render("pages/index", {mainCategories : mainCategories, userIp: userIp, images: galleryPaths, products: queryResult.rows });
    });
});

server.get("/index", function (req, res) {

    console.log("user in index");
    let userIp = requestIp.getClientIp(req);
    let galleryPaths = pictureCheck();

    const result = client.query("select * from products where special = true", function (err, queryResult) {
        res.render("pages/index.ejs", {mainCategories : mainCategories, userIp: userIp, images: galleryPaths, products: queryResult.rows });
    });
});

server.get("/galerie", function (req, res) {

    let galleryPaths = pictureCheck();
    res.render("pages/galerie.ejs", {mainCategories : mainCategories, images: galleryPaths});
    console.log("user in galerie");
});

server.get("/produse", function (req, res) {
    client.query("select * from products", function (err, queryResult) {
        res.render("pages/produse.ejs", {mainCategories : mainCategories, secondCategories: secondCategories, products: queryResult.rows, mainCategory: req.query.mainCategory });
        console.log("user in produse");
    });
});

server.get("/produs/:id_prod", function (req, res) {
    console.log("user in" + req.url);

    const result = client.query("select * from products where id=" + req.params.id_prod, function (err, queryResult) {
        res.render("pages/produs.ejs", {mainCategories : mainCategories, products: queryResult.rows });
    });
});

server.get("/*", function (req, res) {
    console.log("user in " + req.url);
    res.render("pages" + req.url + ".ejs", {mainCategories : mainCategories}, function (err, renderResult) {
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