// const http = require('http');

// const server = http.createServer((req,res) => {
//     if(req.url === '/'){
//         res.write("Assalamualaikum Nazeemuddin");
//     } else if(req.url === '/about') {
//         res.write("App Khairyat se ho");
//     } else {
//         res.write("No such url");
//     }
//     res.end();
// });

// server.listen(3000,() => {
//     console.log("server start listening at port 3000");
// })  7893238540  HR => Venkata sasi kumar


// 1.npm install express
// 2.install nodemon for js changes, npm i -g nodemon (for nodejs changes to reflect )
// API key - 98e31a0b8b4e2586697c5f2b8a90b484
// https://api.themoviedb.org/3/genre/movie/list?api_key=98e31a0b8b4e2586697c5f2b8a90b484
// https://api.themoviedb.org/3/movie/popular?api_key=98e31a0b8b4e2586697c5f2b8a90b484

import express from 'express'
//const express = require('express');
import bcrypt from 'bcryptjs'
//const bcrypt = require("bcryptjs");
import jwt from 'jsonwebtoken'
//const jwt = require("jsonwebtoken");
import cors from "cors";

const app = express()

const SECRET_KEY = "db16ff8eed3521783f3dfc9d1428e9456774d6cfadeab4e53cf6a7a1857d744091ec18471f675d3d3e71f71de8d552d43e906bfe950d330960ddd32fd9f189f2";

//const movieArr = require('./movie.json');
import movieArr from './movie.json' with { type: 'json' }
import todosArr from './todos.json' with { type: 'json' }
import todoArr from './todo.json' with { type: 'json' }
// import users from './users.json' with { type: 'json' }
// import { users, fetchUsers, saveUser } from './main.js'
import { usersDetails as users, fetchUsers, saveUser, usersDetails } from './railwaypostgress.js'

app.use(express.json())

// Enable CORS if your React app is on a different origin
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity in development
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   // ✅ FIX: Add Authorization here
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//   next();
// });


app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.get('/', (req, res) => {
  res.send('Hello SK Nazeemuddin')
})

app.get('/movies', (req, res) => {
  res.send(movieArr);
})

app.get('/movies/:id', (req, res) => {
  const movieId = parseInt(req.params.id - 1);
  const movie = movieArr.find((m, index) => index === movieId)
  res.send(movie)
})

app.get('/todos', (req, res) => {
  res.send(todosArr)
})

app.get('/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  console.log(todoId);
  const todo = todosArr.find((t) => t.id === todoId)
  res.send(todo)
})

app.get('/todos/:id/:status', (req, res) => {
  res.send(req.params);
})

app.patch('/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  const todoUpdate = req.body;

  const todoIndex = todosArr.findIndex(todo => todo.id === todoId)
  if (todoIndex === -1) {
    return res.status(400).send("Todo Item not found");
  }

  todosArr[todoIndex] = { ...todosArr[todoIndex], ...todoUpdate };
  res.status(200).send(todosArr);
})

app.put('/todos/:id', (req, res) => {
  const todoId = parseInt(req.params.id);
  const todoUpdate = req.body;

  const todoIndex = todosArr.findIndex(todo => todo.id === todoId)
  if (todoIndex === -1) {
    return res.status(400).send("Todo Item not found");
  }

  todosArr[todoIndex] = { ...todosArr[todoIndex], ...todoUpdate };
  res.status(200).send(todosArr);
})

app.post('/todos', (req, res) => {
  const todo = req.body;
  const newTodo = {
    id: todosArr[todosArr.length - 1].id + 1,
    task: todo.task,
    status: todo.status
  };
  todosArr.push(newTodo);
  res.status(200).send(todosArr);
})

// Todo request handling

app.get('/todo', (req, res) => {
  res.status(200).send(todoArr)
})

app.post('/todo', (req, res) => {
  const todo = req.body;
  const newTodo = {
    taskName: todo.taskName
  };
  todoArr.push(newTodo);
  res.status(200).send(todoArr);
})

app.delete('/todo/:id', (req, res) => {
  const todoIndex = parseInt(req.params.id);
  const initialLength = todoArr.length;

  if (todoIndex > -1 && todoIndex <= initialLength) {
    todoArr.splice(todoIndex, 1);
    res.status(200).send(todoArr);
  } else {
    res.status(404).send(`Todo item not found.`);
  }
});


// form handling
app.post('/submitform', async (req, res) => {
  const isEmailvalid = users.find(user => req.body.email === user.email);
  if (isEmailvalid) {
    return res.status(400).send(`Email already exists`);
  }
  if (req.body.password === req.body.repassword) {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newUser = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
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


app.get('/users', (req, res) => {
  res.status(200).send(users)
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
  const user = users.find(user => loggedUser.email === user.email);

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

  // try {
  //   //if ((loggedUser.password === user.password) && (loggedUser.firstName === user.firstName)) {
  //   if ((await bcrypt.compare(loggedUser.password, user.password)) && (loggedUser.email === user.email)) {
  //     res.status(200).send(`Success`);
  //   } else {
  //     res.status(401).send(`Not allowed`);
  //   }
  // } catch {
  //   res.status(500).send(`Error`);
  // }
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


// app.post('/users/login', (req, res) => {
//   const { firstName, password } = req.body;
//   if (!firstName || !password) {
//     return res.status(400).json({ message: 'Missing credentials' });
//   }

//   const user = users.find(u => u.firstName === firstName);
//   if (!user) {
//     return res.status(401).json({ message: 'Invalid username or password' });
//   }

//   if (password !== user.password) {
//     return res.status(401).json({ message: 'Invalid username or password' });
//   }

//   return res.status(200).json({ message: 'Success' });
// });


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`server1 start listening at port ${PORT}...`);
})

