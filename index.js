const createServerExpress = require('express');
const server = createServerExpress(); // server as object
const path = require("path");

server.set("view engine", "ejs");

server.use("/src", createServerExpress.static(path.join(__dirname, "src")));

server.get("/", function (req, res) {

    res.render("pages/index.ejs");

});

server.get("/empty", function(req,res){
    res.render("empty.ejs");
})


// un exemplu
server.get("/data", function (req, res) {
    res.setHeader("Content-type", "text/html");
    console.log("salut3");
    res.write("<!DOCTYPE html><html><body>" + new Date());
    res.write("</body></html>");
    res.end();
});


server.listen(8080);
console.log("Am pornit serverul");