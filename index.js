import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";


const app = express();
const port = 3000;
const saltRounds = 10;


app.use(
    session({
      secret: "marjorie",
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 1000 * 60 * 60
      }
    })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());  

const db = new pg.Client({
    user: "postgres",
    host: "viaduct.proxy.rlwy.net",
    database: "railway",
    password: "FmTdaZNMgvCxfPfDxmTqPFRyTLrRKelE",
    port: "19933",
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

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/", (req, res) => {
    res.redirect("/home");
});



app.get("/home", async (req, res) => {
    if (req.isAuthenticated()){
    try { 
        const result = await db.query("SELECT * FROM bookinfo ORDER BY id ASC");
        res.render("index.ejs", {
            books: result.rows
        });

    } catch (error) {
        console.log(error);
    }
} else {
    res.redirect("/login");
}
});

app.get("/compose", async (req, res) => {
    res.render("compose.ejs");
});

app.get("/pages/:id", async (req, res) => {
    if (req.isAuthenticated()){
    const id = req.params.id;
    const post = await db.query(`SELECT * FROM bookinfo WHERE id = ${id}`);
    const notes = await db.query(`SELECT * FROM booknotes WHERE book_id = ${id}`);
    res.render("bookpage.ejs", {
            book: post.rows[0],
            notes: notes.rows
        });
    } else {
        res.redirect("/login");
    }

});



app.get("/edit/:id", async (req, res) => {
    if (req.isAuthenticated()){
    const id = req.params.id;
    const post = await db.query(`SELECT * FROM bookinfo WHERE id = ${id}`);
    res.render("edit.ejs", {
        book: post.rows[0]
    });
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/home",
      failureRedirect: "/login",
    })
);

app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (checkResult.rows.length > 0) {
            res.redirect("/login");
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.error("Error hashing password:", err);
                } else {
                    const result = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", 
                    [email, hash]
                );
                const user = result.rows[0];
                req.login(user, (err) => {
                    console.log("success");
                    res.redirect("/home");
                });
            }
        });
        }
    } catch (err) {
        console.log(err);
    }
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
    if (req.isAuthenticated()){
    const id = req.params.id;
    const { title, isbn, author, description, rating } = req.body;
    await db.query(`UPDATE bookinfo SET title = '${title}', isbn = ${isbn}, author = '${author}', description = '${description}', rating = ${rating} WHERE id = ${id}`);
    res.redirect("/");
    } else {
        res.redirect("login");
    }
});



app.post("/editnotes/:id", async (req, res) => {
    if (req.isAuthenticated()){
    const id = req.params.id;
    const notes = req.body.mynotes;
    await db.query(`INSERT INTO booknotes (notes, book_id) VALUES ('${notes}', ${id})`);
    res.redirect(`/pages/${id}`);
    } else {
        res.redirect("/login");
    }
});


app.post("/sort", async (req, res) => {
    if (req.isAuthenticated()){
    const sort = req.body.sort;
    const result = await db.query(`SELECT * FROM booknotes ORDER BY ${sort} DESC`);
    res.render("index.ejs", {
        books: result.rows
    });
    } else {
        res.redirect("/");
    }
});



passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
        try {
            const result = await db.query("SELECT * FROM users WHERE email = $1", [
                username,
            ]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;
                bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                    if (err) {
                        console.error("Error comparing passwords:", err);
                        return cb(err);
                    } else {
                        if (valid) {
                            return cb(null, user);
                        } else {
                            return cb(null, false);
                        }
                    }
                });
            } else {
                return cb("User not found");
            }
        } catch (err) {
            console.log(err);
        }
    })
);


passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  
