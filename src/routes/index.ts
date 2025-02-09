import { Router } from 'express';
import authController from '../controllers/AuthController.ts';
import userController from '../controllers/UserController.ts';
import AgentController from '../controllers/AgentController.ts';
import homeController from '../controllers/HomeController.ts';
import contentController from '../controllers/ContentController.ts';

const router: Router = Router();

// Home route
router.get('/', homeController.index.bind(homeController));
router.get('/store', homeController.store.bind(homeController));

// Auth routes
router.get('/auth/login', authController.login.bind(authController));
router.get('/auth/callback/google', authController.authGoogleCallback.bind(authController));
router.get('/auth/logout', authController.logout.bind(authController));

// User routes
router.get('/users/profile', userController.getProfile.bind(userController));
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);

// Content routes
router.post('/content/suggest', contentController.suggest.bind(contentController));
router.post('/content/reply', contentController.reply.bind(contentController));

// Agent routes
router.post('/agent/system/reply', AgentController.sysReply.bind(AgentController));
router.get('/agents', AgentController.getAgents);

export default router;
