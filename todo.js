
import express from 'express'
const app = express()

import todoArrs from './todo.json' with { type: 'json' }

app.use(express.json())

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity in development
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


app.get('/todo', (req, res) => {
    res.send(todoArrs);
})

app.post('/todo', (req, res) => {
    const todo = req.body;
    const newTodo = {
        taskName: todo.taskName
    };
    todoArrs.push(newTodo);
    res.status(200).send(todoArrs);
})

app.delete('/todo/:id', (req, res) => {
    const todoIndex = parseInt(req.params.id);
    const initialLength = todoArrs.length;

    if (todoIndex > -1 && todoIndex < initialLength) {
        todoArrs.splice(todoIndex, 1);
        res.status(200).send(todoArrs);
    } else {
        res.status(404).send(`Todo item not found.`);
    }
});



const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`server2 start listening at port ${PORT}...`);
})

