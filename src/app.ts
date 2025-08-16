import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';
import cookieParser from 'cookie-parser';
import mongoose, { ConnectOptions, Model } from 'mongoose';
import TestModel from './models/Test';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  public server: ReturnType<typeof createServer>;
  private MONGO_URI: string | undefined;
  private isDBConnected!: boolean;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);

    this.initializeMiddlewares();
    this.initializeDatabase();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cors());

    // Add request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }



  private initializeRoutes(): void {

    // MongoDB test endpoint
    this.app.get('/mongo-test', (req: Request, res: Response, next: NextFunction): void => {
      if (!this.isDBConnected) {
        res.status(503).json({ error: 'Database not connected' });
        return;
      }

      // Use an async IIFE to handle async/await with error forwarding
      (async () => {
        try {
          // Create a test document
          const testDoc = new TestModel();
          await testDoc.save();

          // Retrieve all test documents
          const docs = await TestModel.find().sort({ createdAt: -1 }).limit(10);

          res.json({
            status: 'success',
            message: 'MongoDB connection test successful',
            latestDocument: testDoc,
            recentDocuments: docs
          });
        } catch (error) {
          console.error('MongoDB test error:', error);
          res.status(500).json({ error: 'MongoDB operation failed' });
        }
      })().catch(next);
    });

    // Main routes
    this.app.use('/', routes);
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  private initializeDatabase(): void {
    this.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/booking-guru';
    this.isDBConnected = false;

    if (!this.MONGO_URI) {
      console.error('MongoDB connection URI not found in environment variables');
      process.exit(1);
    }

    const mongooseOptions: ConnectOptions = {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000 // 30 seconds
    };

    mongoose
      .connect(this.MONGO_URI, mongooseOptions)
      .then(() => {
        console.log('Successfully connected to MongoDB');
        this.isDBConnected = true;
      })
      .catch((error: Error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
      });

    mongoose.connection.on('error', (error: Error) => {
      console.error('MongoDB runtime error:', error);
      this.isDBConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      this.isDBConnected = false;
    });
  }

  public start(port: number): void {
    this.server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  }
  public getDBStatus(): boolean {
    return this.isDBConnected;
  }
}

export default App;