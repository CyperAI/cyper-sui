import { DirectClient } from "@elizaos/client-direct";
import {
  AgentRuntime,
  Memory,
  elizaLogger,
  settings,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
import { solanaPlugin } from "@elizaos/plugin-solana";
import * as fs from 'fs';
import net from "net";
import * as path from 'path';
import { fileURLToPath } from "url";
import { initializeDbCache } from "./cache/index.ts";
import { character } from "./character.ts";
import { startChat } from "./chat/index.ts";
import { initializeClients } from "./clients/index.ts";
import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import { initializeDatabase } from "./database/index.ts";
import express, { Request, Response } from 'express';
import session, { MemoryStore } from 'express-session';
import routes from './routes/index.js';
import { WalrusService } from "./storage/WalrusService.ts";
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
app.set('views', path.join(__dirname, '../views'));

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

export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

let nodePlugin: any | undefined;

export function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string
) {
  elizaLogger.success(
    elizaLogger.successesTitle,
    "Creating runtime for character",
    character.name,
  );

  nodePlugin ??= createNodePlugin();

  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: [],
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
      character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
    ].filter(Boolean),
    providers: [],
    actions: [],
    services: [],
    managers: [],
    cacheManager: cache,
  });
}

async function startAgent(character: Character, directClient: DirectClient) {
  try {
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const token = getTokenForProvider(character.modelProvider, character);
    const dataDir = path.join(__dirname, "../data");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = initializeDatabase(dataDir);

    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache, token);

    await runtime.initialize();

    runtime.clients = await initializeClients(character, runtime);

    directClient.registerAgent(runtime);

    // report to console
    elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

    return runtime;
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error,
    );
    console.error(error);
    throw error;
  }
}

const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

const startAgents = async () => {
  const directClient = new DirectClient();
  let serverPort = parseInt(settings.SERVER_PORT || "3000");
  const args = parseArguments();

  let charactersArg = args.characters || args.character;
  let characters = [character];

  console.log("charactersArg", charactersArg);
  if (charactersArg) {
    characters = await loadCharacters(charactersArg);
  }
  console.log("characters", characters);
  try {
    for (const character of characters) {
      await startAgent(character, directClient as DirectClient);
    }
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }

  while (!(await checkPortAvailable(serverPort))) {
    elizaLogger.warn(`Port ${serverPort} is in use, trying ${serverPort + 1}`);
    serverPort++;
  }

  // upload some agent functionality into directClient
  directClient.startAgent = async (character: Character) => {
    // wrap it so we don't have to inject directClient later
    return startAgent(character, directClient);
  };

  directClient.start(serverPort);

  if (serverPort !== parseInt(settings.SERVER_PORT || "3000")) {
    elizaLogger.log(`Server started on alternate port ${serverPort}`);
  }

  const isDaemonProcess = process.env.DAEMON_PROCESS === "true";
  if(!isDaemonProcess) {
    elizaLogger.log("Chat started. Type 'exit' to quit.");
    const chat = startChat(characters);
    chat();
  }
};

// startAgents().catch((error) => {
//   elizaLogger.error("Unhandled error in startAgents:", error);
//   process.exit(1);
// });

// test().catch((error) => {
//   elizaLogger.error("Unhandled error in test2:", error);
//   process.exit(1);
// });



async function test() {
    try {
      const walrusService = new WalrusService();

      const jsonData1 = {
        "name": "007yuyue@gmail.com",
        "plugins": ["@elizaos/plugin-sui"],
        "clients": [],
        "modelProvider": "openai",
        "settings": {
          "secrets": {}
        },
        "system": "You are a helpful AI assistant for 007yuyue@gmail.com",
        "bio": [
          "You are an AI and Web3 enthusiast who blends emerging technologies with a fun, vibrant lifestyle. A visionary explorer who lives on the cutting edge of innovation and social experiences."
        ],
        "lore": [
          "Bob is an energetic innovator and connector at the intersection of AI, blockchain, and decentralized systems. With a passion for transforming digital landscapes, Bob believes that AI and Web3 are not just technologies—they’re movements driving humanity toward a decentralized, autonomous, and creative future."
        ],
        "messageExamples": [
          []
        ],
        "postExamples": [
          "AI tools can automate tasks, but what excites me more is AI that can collaborate and co-create with humans. The real magic happens there."
        ],
        "adjectives": [
          "dynamic",
          "passionate",
          "collaborative",
          "innovative",
          "vibrant"
        ],
        "topics": [
          "AI",
          "Web3",
          "DAOs",
          "community building",
          "parties and networking",
          "decentralized creativity"
        ],
        "style": {
          "all": [
            "energetic, visionary, and casual"
          ],
          "chat": [
          "engage playfully, but drop insightful tech ideas"
          ],
          "post": [
            "blend fun with deep tech insights"
          ]
        }
      }
      const result1 = await walrusService.uploadJson(jsonData1);
      console.log('Upload successful:', result1);
      let blobId;
      if(result1.info.newlyCreated) {
        blobId = result1.info.newlyCreated.blobObject.blobId;
      }else{
        blobId = result1.info.alreadyCertified.blobId;
      }
      console.log('Blob ID:', blobId);

      // download it
      const result2 = await walrusService.fetchJson(blobId);
      console.log('Download successful:', result2);


    } catch (error) {
        console.error('Error in test:', error);
        throw error;
    }
}

async function test2() {
    try {
        // Read the summarizer.json file
        const jsonData = await fs.promises.readFile(path.join(__dirname, 'summarizer.json'), 'utf8');
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], 'summarizer.json', { type: 'application/json' });

        // Create WalrusService instance and upload
        const walrusService = new WalrusService();
        const result = await walrusService.uploadFile(jsonFile, 1);
        
        if (result.error) {
            console.error('Upload failed:', result.error);
            return;
        }

        console.log('Upload2 successful:', result.info);
        const blobId = result.info.newlyCreated?.blobObject.blobId || 
                      result.info.alreadyCertified?.blobId;
        console.log('Blob ID:', blobId);

        if (blobId) {
            // download and parse JSON
            const jsonResult = await walrusService.fetchJson(blobId);
            if (jsonResult.error) {
                console.error('Failed to fetch JSON:', jsonResult.error);
            } else {
                console.log('Downloaded JSON:', jsonResult.data);
            }
        }
    } catch (error) {
        console.error('Error in test2:', error);
    }
}