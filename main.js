//const { Client } = require('pg')
import { Client } from 'pg'
import express from 'express'

const app = express()
app.use(express.json())

let users = [];

const con = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'asdf@123',
    port: '5432',
    database: 'demo'
})

con.connect().then(() => console.log('database connected'))



app.post("/postData", (req, res) => {
    const { name, id } = req.body
    const insert_query = `INSERT INTO "DemoTable" (name,id) VALUES ($1,$2)`
    con.query(insert_query, [name, id], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send("Posted data");
            console.log(result);
        }
    })

})


app.get("/fetchData", (req, res) => {
    const fetch_query = `SELECT * FROM "DemoTable"`
    con.query(fetch_query, (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send(result.rows)
        }
    })
})

app.get("/fetchData/:id", (req, res) => {
    const id = req.params.id;
    const fetch_query = `select * from "DemoTable" where id=$1`
    con.query(fetch_query, [id], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            console.log(result);
            res.send(result.rows[0]);
        }
    })
})

app.put("/updateData/:id", (req, res) => {
    const id = req.params.id;
    const name = req.body.name;
    const update_query = `UPDATE "DemoTable" SET name=$1 WHERE id=$2`
    con.query(update_query, [name, id], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            console.log("updated")
            res.send(result)
        }
    })
})

app.delete("/delete/:id", (req, res) => {
    const id = req.params.id;
    const delete_query = `DELETE FROM "DemoTable" WHERE id=$1`
    con.query(delete_query, [id], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            console.log("deleted");
            res.send(result)
        }
    })
})

//Users Table CRUD Operation
app.post("/postUsersData", (req, res) => {
    const { firstName, lastName, email, password, designation, mobile, gender } = req.body


    const insert_query = `INSERT INTO users ("firstName","lastName",email,password,designation,mobile,gender) VALUES ($1,$2,$3,$4,$5,$6,$7)`
    con.query(insert_query, [firstName, lastName, email, password, designation, mobile, gender], (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send("Posted Users data");
            console.log(result);
        }
    })

})

app.get("/fetchUsersData/:firstName", async (req, res) => {
    const firstName = req.params.firstName;
    const fetch_query = `SELECT * FROM users WHERE "firstName" = $1`

    try {
        const result = await con.query(fetch_query, [firstName]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No user found" });
        }

        if (result.rows[0].firstName === firstName) {
            return res.send(true);
        } else {
            return res.send(false);
        }
    } catch (err) {
        console.error("Database error:", err.message);

        // Differentiate error types
        if (err.code === "42P01") {
            // Undefined table
            return res.status(500).json({ error: "Table does not exist" });
        } else if (err.code === "42703") {
            // Undefined column
            return res.status(500).json({ error: "Column does not exist" });
        } else {
            // Generic fallback
            return res.status(500).json({ error: "Database query failed" });
        }
    }
})

app.get("/fetchUsersData", async (req, res) => {
    const fetch_query = `SELECT * FROM users`

    try {
        const result = await con.query(fetch_query);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No user found" });
        }
        const users = result.rows;
        return res.status(200).send(result.rows)

    } catch (err) {
        console.error("Database error:", err.message);

        // Differentiate error types
        if (err.code === "42P01") {
            // Undefined table
            return res.status(500).json({ error: "Table does not exist" });
        } else if (err.code === "42703") {
            // Undefined column
            return res.status(500).json({ error: "Column does not exist" });
        } else {
            // Generic fallback
            return res.status(500).json({ error: "Database query failed" });
        }
    }
})

app.delete("/deleteUsersData/:firstName", (req, res) => {
    const firstName = req.params.firstName;
    const delete_query = `DELETE FROM users WHERE "firstName" = $1`
    con.query(delete_query, [firstName], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            console.log("deleted");
            res.send(result)
        }
    })
    fetchUsers();
})

async function fetchUsers() {
    try {
        const result = await con.query('SELECT * FROM users');
        users.length = 0;            // clear old data
        users.push(...result.rows);  // update with new data

        users.forEach((user, index) => {
            console.log(index + 1, user.firstName);
        });

        return users;
    } catch (err) {
        console.error('Database error:', err.message);
        throw err;
    }
}

fetchUsers();

async function saveUser(userData) {
    const { firstName, lastName, email, password, designation, mobile, gender } = userData;


    const insert_query = `INSERT INTO users ("firstName","lastName",email,password,designation,mobile,gender) VALUES ($1,$2,$3,$4,$5,$6,$7)`
    try {
        const result = await con.query(insert_query, [firstName, lastName, email, password, designation, mobile, gender]);
        users.push(result.rows[0]);
        console.log("Record inserted");
        fetchUsers();
        return result.rows[0];
    } catch (err) {
        console.log("Error while inserting")
    }
}



app.listen(4002, () => {
    console.log("server is running at port 4002....")
})

// module.exports = { users, fetchUsers };
export { users, fetchUsers, saveUser };