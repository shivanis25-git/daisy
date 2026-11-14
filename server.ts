import http from 'http';
import fs from 'fs';
import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server as SocketIOServer, Socket } from 'socket.io';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  initDatabase,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPreferences,
  getAllUsers,
  saveEmail,
  getEmailsForUser,
  getEmailById,
  markEmailAsRead,
  toggleEmailStarred,
  deleteEmail,
} from './server/db.js';
import { generateToken, verifyToken, requireAuth, AuthRequest } from './server/auth.js';
import { sendMail } from './server/mailer.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

async function startServer() {
  // 1. Initialize Dual Database (MongoDB with JSON store fallback)
  const dbStatus = await initDatabase();

  const app = express();
  const server = http.createServer(app);

  // 2. Setup CORS for Express
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Setup Socket.IO with permissive CORS & Auth
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // Track online users: Set of lowercase emails
  const onlineUsers = new Set<string>();

  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string);

    if (!token) {
      console.warn('[Socket.IO] Connection rejected: No token provided in handshake');
      return next(new Error('Authentication required for socket connection'));
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) {
      console.warn('[Socket.IO] Connection rejected: Invalid or expired token');
      return next(new Error('Invalid token for socket'));
    }

    (socket as any).user = decoded;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!user || !user.email) return;

    const email = user.email.toLowerCase();
    const userRoom = `user:${email}`;
    socket.join(userRoom);
    onlineUsers.add(email);

    console.log(`[Socket.IO] User connected: ${user.name} (${email}) -> Room: ${userRoom} [Socket ID: ${socket.id}]`);

    // Broadcast updated presence to all clients
    io.emit('presence:update', Array.from(onlineUsers));

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Socket ${socket.id} disconnected (${email}). Reason: ${reason}`);
      // Check if user has other open sockets
      const matchingSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => (s as any).user?.email?.toLowerCase() === email && s.id !== socket.id
      );

      if (matchingSockets.length === 0) {
        onlineUsers.delete(email);
        console.log(`[Socket.IO] User went offline: ${email}`);
        io.emit('presence:update', Array.from(onlineUsers));
      }
    });
  });

  // 4. Express Body Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 5. REST API Routes
  // --- Health / Status ---
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'Daisy Smart Mail & Voice Assistant',
      db: dbStatus.isMongo ? 'MongoDB' : 'Local JSON Store',
      onlineCount: onlineUsers.size,
      onlineUsers: Array.from(onlineUsers),
      timestamp: new Date().toISOString(),
    });
  });

  // --- Auth: Register ---
  app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email and password are required.' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await findUserByEmail(normalizedEmail);
      if (existing) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await createUser({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || 'Member',
      });

      console.log(`[Auth] Registered new user: ${newUser.name} (${newUser.email})`);

      // Send automated Welcome Email via Nodemailer
      const mailResult = await sendMail({
        from: 'system@daisy.mail',
        fromName: 'Daisy Assistant',
        to: newUser.email,
        toName: newUser.name,
        subject: `Welcome to Daisy Smart Mail, ${newUser.name}!`,
        text: `Welcome to Daisy Smart Mail & Voice Assistant System.\n\nYour account has been successfully created. Daisy will notify you in real-time whenever a new email arrives and read messages aloud with speech synthesis.\n\nExplore your inbox, use the compose modal to send messages, and customize speech rates in Voice Settings.\n\nHappy Hackathon!\n— Team Daisy`,
      });

      await saveEmail({
        from: 'system@daisy.mail',
        fromName: 'Daisy Assistant',
        to: newUser.email,
        toName: newUser.name,
        subject: `Welcome to Daisy Smart Mail, ${newUser.name}!`,
        body: `Welcome to Daisy Smart Mail & Voice Assistant System.\n\nYour account has been successfully created. Daisy will notify you in real-time whenever a new email arrives and read messages aloud with speech synthesis.\n\nExplore your inbox, use the compose modal to send messages, and customize speech rates in Voice Settings.\n\nHappy Hackathon!\n— Team Daisy`,
        messageId: mailResult.messageId,
        smtpResponse: mailResult.response,
      });

      const token = generateToken(newUser);
      const { password: _, ...safeUser } = newUser;

      res.status(201).json({ token, user: safeUser });
    } catch (err: any) {
      console.error('[API Register Error]', err);
      res.status(500).json({ error: err.message || 'Registration failed.' });
    }
  });

  // --- Auth: Login ---
  app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log(`[Auth] Login attempt for: ${normalizedEmail}`);

      const user = await findUserByEmail(normalizedEmail);
      if (!user || !user.password) {
        console.warn(`[Auth] User not found: ${normalizedEmail}`);
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.warn(`[Auth] Password mismatch for: ${normalizedEmail}`);
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = generateToken(user);
      const { password: _, ...safeUser } = user;
      console.log(`[Auth] Login successful: ${user.name} (${user.email})`);

      res.json({ token, user: safeUser });
    } catch (err: any) {
      console.error('[API Login Error]', err);
      res.status(500).json({ error: err.message || 'Login failed.' });
    }
  });

  // --- Auth: Me (Verify & Refresh Profile) ---
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { password, ...safeUser } = req.user;
    res.json({ user: safeUser });
  });

  // --- Auth: Update Voice Preferences ---
  app.patch('/api/auth/preferences', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const { autoAnnounce, muted, voiceRate, voicePitch, selectedVoiceURI } = req.body;

      const updated = await updateUserPreferences(req.user.id, {
        ...(typeof autoAnnounce === 'boolean' && { autoAnnounce }),
        ...(typeof muted === 'boolean' && { muted }),
        ...(typeof voiceRate === 'number' && { voiceRate }),
        ...(typeof voicePitch === 'number' && { voicePitch }),
        ...(typeof selectedVoiceURI === 'string' && { selectedVoiceURI }),
      });

      if (!updated) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Users Directory with Live Online Status ---
  app.get('/api/users/directory', requireAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const allUsers = await getAllUsers();
      const directory = allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        role: u.role,
        isOnline: onlineUsers.has(u.email.toLowerCase()),
      }));
      res.json({ users: directory });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Emails: List Inbox & Sent ---
  app.get('/api/emails', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const data = await getEmailsForUser(req.user.email);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Emails: Send Email ---
  app.post('/api/emails/send', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const { to, subject, body } = req.body;

      if (!to || !subject || !body) {
        res.status(400).json({ error: 'Recipient (to), subject, and body are required.' });
        return;
      }

      const recipientEmail = to.toLowerCase().trim();
      const recipientUser = await findUserByEmail(recipientEmail);
      const recipientName = recipientUser ? recipientUser.name : recipientEmail.split('@')[0];

      // Step 1: Send through Nodemailer
      const mailResult = await sendMail({
        from: req.user.email,
        fromName: req.user.name,
        to: recipientEmail,
        toName: recipientName,
        subject,
        text: body,
      });

      // Step 2: Save to Dual DB repository
      const savedEmail = await saveEmail({
        from: req.user.email,
        fromName: req.user.name,
        to: recipientEmail,
        toName: recipientName,
        subject,
        body,
        messageId: mailResult.messageId,
        smtpResponse: mailResult.response,
        deliveryStatus: mailResult.rejected.length > 0 ? 'failed' : 'delivered',
      });

      // Step 3: Broadcast real-time Socket.IO notification to Recipient's Room
      const recipientRoom = `user:${recipientEmail}`;
      console.log(`[Socket.IO] Emitting 'mail:received' to room: ${recipientRoom}`);
      io.to(recipientRoom).emit('mail:received', {
        email: savedEmail,
      });

      // Step 4: Emit 'mail:sent' to Sender's Room
      const senderRoom = `user:${req.user.email.toLowerCase()}`;
      io.to(senderRoom).emit('mail:sent', {
        email: savedEmail,
      });

      res.status(201).json({
        success: true,
        email: savedEmail,
        smtp: {
          messageId: mailResult.messageId,
          response: mailResult.response,
          isRealSmtp: mailResult.isRealSmtp,
        },
      });
    } catch (err: any) {
      console.error('[API Send Mail Error]', err);
      res.status(500).json({ error: err.message || 'Failed to dispatch email.' });
    }
  });

  // --- Emails: Mark as Read/Unread ---
  app.patch('/api/emails/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const { id } = req.params;
      const { isRead } = req.body;

      const updated = await markEmailAsRead(id, Boolean(isRead));
      if (!updated) {
        res.status(404).json({ error: 'Email not found.' });
        return;
      }

      const recipientRoom = `user:${req.user.email.toLowerCase()}`;
      io.to(recipientRoom).emit('mail:updated', { email: updated });

      res.json({ email: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Emails: Toggle Star ---
  app.patch('/api/emails/:id/star', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await toggleEmailStarred(id);
      if (!updated) {
        res.status(404).json({ error: 'Email not found.' });
        return;
      }
      res.json({ email: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Emails: Delete Email ---
  app.delete('/api/emails/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) return;
      const { id } = req.params;
      const success = await deleteEmail(id, req.user.email);

      if (!success) {
        res.status(404).json({ error: 'Email not found or unauthorized to delete.' });
        return;
      }

      const userRoom = `user:${req.user.email.toLowerCase()}`;
      io.to(userRoom).emit('mail:deleted', { id });

      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Frontend Serving (Vite dev middleware or Static files)
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback: serve index.html with Vite transforms for any client navigation
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Listen
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(` [Daisy] Smart Mail & Voice Assistant listening on http://0.0.0.0:${PORT}`);
    console.log(` Dual DB Mode: ${dbStatus.isMongo ? 'MongoDB (Connected)' : 'Local JSON Store (data/daisy-store.json)'}`);
    console.log(` Real-time Socket.IO: ACTIVE`);
    console.log(` Ready for 2-user demo test (Arjun & Priya)!`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
