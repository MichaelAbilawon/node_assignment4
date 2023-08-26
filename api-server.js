const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 4000;

app.use(bodyParser.json());

const usersFilePath = 'users.json';
const itemsFilePath = 'items.json';

const users = loadUsers();
const items = loadItems();

app.post('/api/users', (req, res) => {
    const newUser = req.body;
    if (!users.find(user => user.username === newUser.username)) {
        users.push(newUser);
        saveUsers();
        res.status(201).json({ message: 'User created successfully' });
    } else {
        res.status(400).json({ message: 'Username already exists' });
    }
});

// Middleware to check for API key authentication
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ message: 'API key is missing' });
    }


    req.userRole = apiKey === 'admin' ? 'admin' : 'user';
    next();
});

app.get('/api/items', (req, res) => {
    if (req.userRole === 'user') {
        res.json(items.map(item => ({ id: item.id, name: item.name, price: item.price })));
    } else {
        res.json(items);
    }
});

// Only admin users can create, update, and delete items
app.post('/api/items', (req, res) => {
    if (req.userRole === 'admin') {
        const newItem = req.body;
        newItem.id = generateItemId();
        items.push(newItem);
        saveItems();
        res.status(201).json(newItem);
    } else {
        res.status(403).json({ message: 'Access forbidden' });
    }
});

app.put('/api/items/:id', (req, res) => {
    if (req.userRole === 'admin') {
        const id = parseInt(req.params.id);
        const updatedItem = req.body;
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedItem };
            saveItems();
            res.json(items[index]);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } else {
        res.status(403).json({ message: 'Access forbidden' });
    }
});

app.delete('/api/items/:id', (req, res) => {
    if (req.userRole === 'admin') {
        const id = parseInt(req.params.id);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            saveItems();
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } else {
        res.status(403).json({ message: 'Access forbidden' });
    }
});

function loadUsers() {
    try {
        const usersData = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(usersData);
    } catch (error) {
        return [];
    }
}

function saveUsers() {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
}

function loadItems() {
    try {
        const itemsData = fs.readFileSync(itemsFilePath, 'utf8');
        return JSON.parse(itemsData);
    } catch (error) {
        return [];
    }
}

function saveItems() {
    fs.writeFileSync(itemsFilePath, JSON.stringify(items, null, 2), 'utf8');
}

function generateItemId() {
    return items.length > 0 ? items[items.length - 1].id + 1 : 1;
}

app.listen(port, () => {
    console.log(`API Server is listening on port ${port}`);
});
