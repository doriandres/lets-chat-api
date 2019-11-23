const express = require('express');
const Sequelize = require('sequelize');
var cors = require('cors');
const app = express();
app.use(require('express-status-monitor')());
app.use(cors());
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const sequelize = new Sequelize('mysql://root:abc123@172.17.0.2:3306/letschat?insecureAuth=true');
// const sequelize = new Sequelize('mysql://root:abc123@localhost:3307/letschat?insecureAuth=true');

const UsersRepository = sequelize.define('user', {
  id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING, allowNull: false },
  email: { type: Sequelize.STRING, allowNull: false },
  password: { type: Sequelize.STRING, allowNull: false },
});

const MessagesRepository = sequelize.define('message', {
  id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  text: { type: Sequelize.STRING, allowNull: false }
});

UsersRepository.hasMany(MessagesRepository, { foreignKey: 'fromId', sourceKey: 'id', as: 'sentMessages' });
MessagesRepository.belongsTo(UsersRepository, { foreignKey: 'fromId', targetKey: 'id', as: 'from' });

UsersRepository.hasMany(MessagesRepository, { foreignKey: 'toId', sourceKey: 'id', as: 'receivedMessages' });
MessagesRepository.belongsTo(UsersRepository, { foreignKey: 'toId', targetKey: 'id', as: 'to' });

UsersRepository.sync();
MessagesRepository.sync();


app.use(express.json());
app.get('/api/users/all', async (req, res) => res.json(await UsersRepository.findAll()));
app.get('/api/messages/all', async (req, res) => res.json(await MessagesRepository.findAll()));
app.post('/api/users/auth', async (req, res) => {
  const users = await UsersRepository.findAll();
  const user = users.find(u => u.email === req.body.email && u.password === req.body.password);
  res.json({ result: user, error: user ? null : true });
});
app.post('/api/users/create', async (req, res) => {
  try {
    res.json({ result: await UsersRepository.create(req.body) })
  } catch{
    res.json({ error: true })
  }
});
app.post('/api/messages/create', async (req, res) => {
  try {
    const message = await MessagesRepository.create(req.body);
    res.json({ result: message })
    io.emit('message', message);
  } catch{
    res.json({ error: true });
  }
});


http.listen(3000);