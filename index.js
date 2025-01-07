const express = require("express");
const app = express();
const ejs = require('ejs');
const path = require("path");
const fs = require("fs");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    fs.readdir("./texts", function (err, files) {
        if (err) {
            console.error("Error reading directory:", err);
            return res.status(500).send("Error reading directory");
        }
        res.render('index', { files: files });
    });

})

app.post("/create", (req, res) => {
    fs.writeFile(`./texts/${(req.body.title).split(" ").join("")}.txt`, req.body.details, function (err) {
        res.redirect("/")
    })
})

app.get("/delete/:filename", (req, res, next) => {
    fs.unlink(`./texts/${req.params.filename}`, function (err) {
        if (err) console.error(err);
        else res.redirect("/");
    })
})

app.get('/edit/:filename', (req, res) => {
    res.render("edit", { fileName: req.params.filename })
})

app.post("/edit", (req, res) => {
    fs.rename(`./texts/${req.body.previous}`, `./texts/${(req.body.new).split(" ").join("")}.txt`, function () {
        res.redirect("/");
    })
})

app.get("/file/:filename", (req, res) => {
    fs.readFile(`./texts/${req.params.filename}`, 'utf-8', function (err, filedata) {
        res.render('show', { fileName: req.params.filename, fileData: filedata })
    });
})

app.listen(process.env.PORT,(err)=>{
    if(err) console.log('Error');
    else console.log('server is running...')
});