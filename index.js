import express from "express";
import bodyParser from "body-parser";
import pg from "pg";



const app = express();
const port = 3000;



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



const db = new pg.Client({
    user: "postgres",
    host: "monorail.proxy.rlwy.net",
    database: "railway",
    password: "ttDDGxtZdUcjIeUDRuDFprLbMSOJiCBW",
    port: "43034",
});
db.connect();



const getNewDate = function (){
    let yourDate = new Date();
    const date = yourDate.toISOString().split('T')[0];
    function morefunction (date){
        const part1 = date.slice(0,4).toString();
        const part2 = date.slice(5,7).toString();
        const part3 = date.slice(8,10).toString();
        const here = part1 + part2 + part3;
        return here
    }
    return morefunction(date);
}

app.get("/dotable", async (req, res) => {
    await db.query("CREATE TABLE bookinfo (id SERIAL PRIMARY KEY, title VARCHAR(45), isbn VARCHAR(30), author VARCHAR(45), description TEXT, rating INT, date VARCHAR(15))");
});

app.get("/", (req, res) => {
    res.redirect("/home");
});



app.get("/home", async (req, res) => {
    try { 
        const result = await db.query("SELECT * FROM bookinfo ORDER BY id ASC");
        res.render("index.ejs", {
            books: result.rows
        });

    } catch (error) {
        console.log(error);
    }

});

app.get("/compose", async (req, res) => {
    res.render("compose.ejs");
});

app.get("/pages/:id", async (req, res) => {
 
    const id = req.params.id;
    const post = await db.query(`SELECT * FROM bookinfo WHERE id = ${id}`);
    const notes = await db.query(`SELECT * FROM booknotes WHERE book_id = ${id}`);
    res.render("bookpage.ejs", {
            book: post.rows[0],
            notes: notes.rows
        });
  

});



app.get("/edit/:id", async (req, res) => {
   
    const id = req.params.id;
    const post = await db.query(`SELECT * FROM bookinfo WHERE id = ${id}`);
    res.render("edit.ejs", {
        book: post.rows[0]
    });
});







app.post("/compose", async (req, res) => {
    const { title, isbn, author, description, rating } = req.body;
    const date = getNewDate();
    try {
    await db.query(`INSERT INTO bookinfo (title, isbn, author, description, rating, date) VALUES('${title}', ${isbn}, '${author}', '${description}', ${rating}, ${date})`)
    res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});

app.post("/edit/:id", async (req, res) => {
    
    const id = req.params.id;
    const { title, isbn, author, description, rating } = req.body;
    await db.query(`UPDATE bookinfo SET title = '${title}', isbn = ${isbn}, author = '${author}', description = '${description}', rating = ${rating} WHERE id = ${id}`);
    res.redirect("/");
});



app.post("/editnotes/:id", async (req, res) => {
   
    const id = req.params.id;
    const notes = req.body.mynotes;
    await db.query(`INSERT INTO booknotes (notes, book_id) VALUES ('${notes}', ${id})`);
    res.redirect(`/pages/${id}`);

});


app.post("/sort", async (req, res) => {
    
    const sort = req.body.sort;
    const result = await db.query(`SELECT * FROM bookinfo ORDER BY ${sort} DESC`);
    res.render("index.ejs", {
        books: result.rows
    });
  
});








app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  
