import { Pool } from 'pg'
import express from 'express'

import cors from "cors"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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

app.get('/', (req, res) => {
    res.send('Hello Railway PostgreSQL')
})

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

// form handling
app.post('/submitform', async (req, res) => {
    const isEmailvalid = usersDetails.find(user => req.body.email === user.email);
    if (isEmailvalid) {
        return res.status(400).send(`Email already exists`);
    }
    if (req.body.password === req.body.repassword) {
        // Generate salt and hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const newUser = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
            designation: req.body.designation,
            mobile: req.body.mobile,
            gender: req.body.gender
        }
        // users.push(newUser);
        await saveUser(newUser);
        console.log('Form Data Received:', req.body); // Access data in req.body
    } else {
        return res.status(400).send(`Passwords do not match`);
    }

    res.status(200).send(`Form Submitted Successfully`);
})



// ✅ Middleware here
const authenticateToken = (req, res, next) => {
    const header = req.headers["authorization"];

    if (!header) {
        return res.status(401).json({ message: "Token missing" });
    }

    const token = header.split(" ")[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }

        req.user = user;
        next();
    });
};


app.post('/users/login', async (req, res) => {
    const loggedUser = await req.body;
    const user = await fetchUsers().then(users => users.find(u => u.email === loggedUser.email));

    // 1. Check user
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
        // return res.status(400).send(`Invalid user`);
    }

    // 2. Validate password
    const isMatch = await bcrypt.compare(loggedUser.password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Generate JWT
    const token = jwt.sign(
        { email: user.email, name: user.firstname },
        SECRET_KEY,
        { expiresIn: "20m" }
    );

    res.json({
        message: "Login successful ✅",
        token: token,
        user: user.firstname
    });

})


app.get("/validate-token", authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Refresh token route
app.post("/refresh-token", authenticateToken, (req, res) => {
    // req.user contains decoded payload from the old token
    const { email, name } = req.user;

    // Issue a new token with extended expiry
    const newToken = jwt.sign(
        { email, name },
        SECRET_KEY,
        { expiresIn: "20m" } // reset expiry
    );

    res.json({
        message: "Token refreshed successfully",
        token: newToken,
        user: name
    });
});


app.listen(4002, () => {
    console.log("server is running at port 4002....")
})

export { usersDetails, fetchUsers, saveUser };
