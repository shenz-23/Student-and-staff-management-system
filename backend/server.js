const express = require('express');
const cors = require('cors');

const app = express();

// Allow requests from your Live Server frontend
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home page test
app.get('/', (req, res) => {
    res.send('Student and Staff Management System');
});

// Backend test
app.get('/test', (req, res) => {
    res.send('Backend is working!');
});

// Login test route
app.post('/login', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({
            message: 'Please fill in all login fields.'
        });
    }

    res.json({
        message: 'Login request received successfully!',
        username: username,
        role: role
    });
});

// Signup test route
app.post('/signup', (req, res) => {
    const { username, password, confirmPassword, role } = req.body;

    if (!username || !password || !confirmPassword || !role) {
        return res.status(400).json({
            message: 'Please fill in all signup fields.'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            message: 'Passwords do not match.'
        });
    }

    res.json({
        message: 'Signup request received successfully!',
        username: username,
        role: role
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
