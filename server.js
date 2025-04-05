import express from 'express';
import mongoose from 'mongoose';

const app = express();
const port = 3000;

app.use(express.json());

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/tradeguard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB подключен'))
  .catch((err) => console.error('Ошибка MongoDB:', err));

// Маршруты
app.get('/api/commission', (req, res) => {
  try {
    res.json({ spot: 0.1, futures: 0.2 });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/referrals/check', (req, res) => {
  try {
    res.json({ isReferral: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/get-balance', (req, res) => {
  try {
    const { exchangeName, apiKey, apiSecret } = req.body;
    if (!exchangeName || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Недостаточно данных' });
    }
    res.json({ total: 1000, spot: 500, futures: 500 });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/commission/pay', (req, res) => {
  try {
    const { walletType, network, amount } = req.body;
    if (!walletType || !network || !amount) {
      return res.status(400).json({ error: 'Недостаточно данных' });
    }
    res.json({ success: true, walletAddress: '0xExampleAddress' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});