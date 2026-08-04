import { Pool } from 'pg'
import express from 'express'

import cors from "cors"

const app = express()
app.use(express.json())

// Enable CORS if your React app is on a different origin
app.use(cors({
    origin: [
        "http://localhost:5174",
        "https://react-app-pearl-psi-70.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

let usersDetails = [];
let contacts = [];

const pool = new Pool({
    connectionString: 'postgresql://postgres:XBkWZBKZiKhOZxptkUmEFixBAJOFjQPq@maglev.proxy.rlwy.net:37351/railway'
});

// Testing working of Live PostgreSQL
// async function getUsers() {
//     try {
//         const result = await pool.query(`SELECT * FROM "usersDetails"`);
//         console.log('getUsers', result.rows);
//     } catch (err) {
//         console.error(err);
//     }
// }
// getUsers();

app.get("/fetchUsersData", async (req, res) => {
    const fetch_query = `SELECT * FROM "usersDetails"`

    try {
        const result = await pool.query(fetch_query);



        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No user found" });
        }
        const usersDetails = result.rows;

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

async function fetchUsers() {
    try {
        const result = await pool.query(`SELECT * FROM "usersDetails"`);
        usersDetails.length = 0;            // clear old data
        usersDetails.push(...result.rows);  // update with new data

        //console.log("userDetails", usersDetails);

        usersDetails.forEach((user, index) => {
            console.log(index + 1, user.firstname);
        });

        return usersDetails;
    } catch (err) {
        console.error('Database error:', err.message);
        throw err;
    }
}



async function saveUser(userData) {
    const { firstname, lastname, email, password, designation, mobile, gender } = userData;

    const insert_query = `INSERT INTO "usersDetails" ("firstname","lastname",email,password,designation,mobile,gender) VALUES ($1,$2,$3,$4,$5,$6,$7)`
    try {
        const result = await pool.query(insert_query, [firstname, lastname, email, password, designation, mobile, gender]);
        usersDetails.push(result.rows[0]);
        console.log("Record inserted");
        fetchUsers();
        return result.rows[0];
    } catch (err) {
        console.log("Error while inserting")
    }
}

fetchUsers();


async function fetchContacts() {
    try {
        const result = await pool.query(`SELECT * FROM "contact"`);
        contacts.length = 0;            // clear old data
        contacts.push(...result.rows);  // update with new data
        //console.log("userDetails", usersDetails);

        contacts.forEach((user, index) => {
            console.log(index + 1, user.firstname);
        });

        return contacts;
    } catch (err) {
        console.error('Database error:', err.message);
        throw err;
    }
}

async function saveContact(formData) {
    const { firstname, lastname, email, mobile, message } = formData;

    const insert_query = `INSERT INTO "contact" ("firstname","lastname",email,mobile,message) VALUES ($1,$2,$3,$4,$5)`
    try {
        const result = await pool.query(insert_query, [firstname, lastname, email, mobile, message]);
        contacts.push(result.rows[0]);
        console.log("ContactRecord inserted");
        fetchContacts();
        return result.rows[0];
    } catch (err) {
        console.log("Error while inserting")
    }
}

fetchContacts();

app.listen(3500, () => {
    console.log("server is running at port 3500....")
})

export { usersDetails, fetchUsers, saveUser, contacts, fetchContacts, saveContact };
