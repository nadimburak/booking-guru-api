import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application, NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  public server: ReturnType<typeof createServer>;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);



    this.initializeMiddlewares();
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
    // Main routes
    this.app.use('/', routes);
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }


  public start(port: number): void {
    this.server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  }

}

export default App;