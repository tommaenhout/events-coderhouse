import { Router } from 'express';

import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authorizeRole.js';

import {
  enroll,
  getTicketsFromUser,
  getTicketsByEvent,
  cancelTicket   
} from '../controllers/tickets.controller.js';

const ticketsRouter = Router();

ticketsRouter.post('event/:eid/enroll', authMiddleware, enroll);
ticketsRouter.get('/my-tickets', authMiddleware, getTicketsFromUser);
ticketsRouter.get('event/:eid/tickets', authMiddleware, authorizeRoles(['admin', 'organizer']), getTicketsByEvent);
ticketsRouter.patch('/:tid/cancel', authMiddleware, cancelTicket);

export default ticketsRouter;