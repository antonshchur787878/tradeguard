import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware для CORS
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Подключение к MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://antonshchur:qazwsx123@cluster0.idvgwxh.mongodb.net/tradeguard?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB Atlas подключен"))
  .catch((err) => {
    console.error("Ошибка MongoDB:", err);
    console.error("Код ошибки:", err.code);
    console.error("Сообщение ошибки:", err.message);
    process.exit(1); // Завершаем процесс, если не удалось подключиться
  });

// Схема пользователя
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String },
  googleId: { type: String },
});

const User = mongoose.model("User", userSchema);

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// Регистрация
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Ошибка при регистрации:", err);
    res.status(500).json({ error: err.message });
  }
});

// Вход
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user || !user.password) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret", { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error("Ошибка при входе:", err);
    res.status(500).json({ error: err.message });
  }
});

// Вход через Google
app.post("/api/google-login", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await User.findOne({ username: email });
    let isNewUser = false;
    if (!user) {
      user = new User({
        username: email,
        name,
        googleId: email,
      });
      await user.save();
      isNewUser = true;
    }

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret", { expiresIn: "1h" });
    res.json({ token, isNewUser });
  } catch (err) {
    console.error("Ошибка при входе через Google:", err);
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для получения данных пользователя
app.get("/api/user-data", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userData = {
      balance: "0.00 USDT",
      bots: [
        { name: "Bybit Futures VIRTUAL LONG", profit: "+1%" },
        { name: "Binance Grid Trading", profit: "+3%" },
      ],
      trades: [
        { pair: "BTC/USDT", profit: "+5%", status: "success" },
        { pair: "ETH/USDT", profit: "-2%", status: "loss" },
        { pair: "BNB/USDT", profit: "+3%", status: "success" },
      ],
    };
    res.json(userData);
  } catch (err) {
    console.error("Ошибка при получении данных пользователя:", err);
    res.status(500).json({ error: err.message });
  }
});

// Защищённые маршруты
app.get("/api/commission", authenticateToken, (req, res) => {
  try {
    res.json({ spot: 0.1, futures: 0.2 });
  } catch (err) {
    console.error("Ошибка при получении комиссии:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/api/referrals/check", authenticateToken, (req, res) => {
  try {
    res.json({ isReferral: true });
  } catch (err) {
    console.error("Ошибка при проверке рефералов:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/get-balance", authenticateToken, (req, res) => {
  try {
    const { exchangeName, apiKey, apiSecret } = req.body;
    if (!exchangeName || !apiKey || !apiSecret) {
      return res.status(400).json({ error: "Недостаточно данных" });
    }
    res.json({ total: 1000, spot: 500, futures: 500 });
  } catch (err) {
    console.error("Ошибка при получении баланса:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/api/commission/pay", authenticateToken, (req, res) => {
  try {
    const { walletType, network, amount } = req.body;
    if (!walletType || !network || !amount) {
      return res.status(400).json({ error: "Недостаточно данных" });
    }
    res.json({ success: true, walletAddress: "0xExampleAddress" });
  } catch (err) {
    console.error("Ошибка при оплате комиссии:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Новый маршрут для пополнения баланса
app.post("/api/user/top-up", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Здесь должна быть логика обновления баланса в базе данных
    // Пример: await User.updateOne({ _id: userId }, { $inc: { balance: amount } });
    res.status(200).json({ newBalance: 100 }); // Временный ответ
  } catch (err) {
    console.error("Ошибка при пополнении баланса:", err);
    res.status(500).json({ error: err.message });
  }
});

// Новый маршрут для получения баланса
app.get("/api/user/balance", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Здесь должна быть логика получения баланса из базы данных
    // Пример: const balance = user.balance || 0;
    res.status(200).json({ balance: 100, isReferral: true }); // Временный ответ
  } catch (err) {
    console.error("Ошибка при получении баланса:", err);
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});