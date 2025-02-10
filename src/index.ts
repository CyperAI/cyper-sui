import {
  AgentRuntime,
  Memory,
  elizaLogger,
  settings,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import * as path from 'path';
import { fileURLToPath } from "url";
import express, { Request, Response } from 'express';
import session, { MemoryStore } from 'express-session';
import routes from './routes/index.js';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up view engine before other middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '../public'), {
  index: false  // Disable serving index.html automatically
}));

app.use(cookieParser());

// Session configuration
const sessionMiddleware = session({
  secret: 'your-secret-key',
  name: 'sessionId',
  resave: true,
  saveUninitialized: true,
  store: new MemoryStore(),
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

app.use(sessionMiddleware);


app.use(routes);

// Start Express server
app.listen(PORT, () => {
  elizaLogger.info(`Express server is running on port ${PORT}`);
});