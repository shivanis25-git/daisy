import fs from 'fs';
import path from 'path';
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Email, UserPreferences } from './types.js';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const JSON_STORE_PATH = path.join(DATA_DIR, 'daisy-store.json');

let isMongoConnected = false;

// ----------------- Mongoose Schemas (for MongoDB Mode) -----------------
interface UserDoc extends Document, Omit<User, 'id'> {}
interface EmailDoc extends Document, Omit<Email, 'id'> {}

const UserSchema = new Schema<UserDoc>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  role: { type: String },
  preferences: {
    autoAnnounce: { type: Boolean, default: true },
    muted: { type: Boolean, default: false },
    voiceRate: { type: Number, default: 1.0 },
    voicePitch: { type: Number, default: 1.0 },
    selectedVoiceURI: { type: String, default: '' },
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

const EmailSchema = new Schema<EmailDoc>({
  from: { type: String, required: true },
  fromName: { type: String, required: true },
  to: { type: String, required: true },
  toName: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  messageId: { type: String, required: true },
  smtpResponse: { type: String, required: true },
  deliveryStatus: { type: String, enum: ['delivered', 'pending', 'failed'], default: 'delivered' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

let UserModel: mongoose.Model<UserDoc>;
let EmailModel: mongoose.Model<EmailDoc>;

// ----------------- JSON Store Structure (for Local Fallback Mode) -----------------
interface JsonStore {
  users: User[];
  emails: Email[];
}

let memoryStore: JsonStore = {
  users: [],
  emails: [],
};

function readJsonStore(): JsonStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(JSON_STORE_PATH)) {
      const data = fs.readFileSync(JSON_STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[Daisy DB] Error reading JSON store:', err);
  }
  return { users: [], emails: [] };
}

function writeJsonStore(store: JsonStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(JSON_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Daisy DB] Error writing JSON store:', err);
  }
}

// ----------------- Initial Seed Data -----------------
async function getSeedUsers(): Promise<User[]> {
  const hashedPassword = await bcrypt.hash('daisy123', 10);
  const now = new Date();

  return [
    {
      id: 'usr_shivani',
      name: 'Shivani',
      email: 'shivani@daisy.mail',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      role: 'Team Lead',
      preferences: {
        autoAnnounce: true,
        muted: false,
        voiceRate: 1.0,
        voicePitch: 1.0,
        selectedVoiceURI: '',
      },
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
  ];
}

function getSeedEmails(): Email[] {
  const now = new Date();
  return [
    {
      id: 'eml_1',
      from: 'assistant@daisy.mail',
      fromName: 'Daisy Assistant',
      to: 'shivani@daisy.mail',
      toName: 'Shivani',
      subject: 'Welcome to Daisy Smart Mail, Shivani!',
      body: 'Hello Shivani,\n\nWelcome to your Daisy Smart Mail workspace. Daisy notifies you in real-time when new emails arrive and reads messages aloud with text-to-speech synthesis.\n\nTry clicking "Listen to Email" to test the voice reader, or use Compose to send an email to yourself or any recipient.\n\nBest regards,\nDaisy Assistant',
      isRead: false,
      isStarred: true,
      messageId: '<2026.welcome.shivani@daisy.mail>',
      smtpResponse: '250 2.0.0 OK: queued as 88a3f910 system-outbox',
      deliveryStatus: 'delivered',
      createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
    },
    {
      id: 'eml_2',
      from: 'design@daisy.mail',
      fromName: 'Daisy Design Team',
      to: 'shivani@daisy.mail',
      toName: 'Shivani',
      subject: 'Aqua Glassmorphism & Voice Engine Ready',
      body: 'Hey Shivani!\n\nThe new Aqua Frutiger Aero dashboard is now active.\n\nKey features enabled:\n- Frosted glass cards with soft elevation\n- Voice Assistant reader with sentence chunking & playback controls\n- Real-time Socket.IO alerts\n\nFeel free to explore Voice Settings to customize the reading speed and tone!',
      isRead: true,
      isStarred: false,
      messageId: '<2026.design.update@daisy.mail>',
      smtpResponse: '250 2.0.0 OK: queued as 77c12de4 design-outbox',
      deliveryStatus: 'delivered',
      createdAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
    },
  ];
}

// ----------------- Database Initialization -----------------
export async function initDatabase(): Promise<{ isMongo: boolean }> {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('[Daisy DB] Connecting to MongoDB...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      UserModel = mongoose.models.User || mongoose.model<UserDoc>('User', UserSchema);
      EmailModel = mongoose.models.Email || mongoose.model<EmailDoc>('Email', EmailSchema);
      isMongoConnected = true;
      console.log('[Daisy DB] Connected to MongoDB successfully.');

      // Check if users exist in MongoDB, if not seed
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('[Daisy DB] Seeding starter accounts in MongoDB...');
        const seedUsers = await getSeedUsers();
        for (const u of seedUsers) {
          const { id, ...rest } = u;
          await UserModel.create(rest);
        }
        const seedEmails = getSeedEmails();
        for (const e of seedEmails) {
          const { id, ...rest } = e;
          await EmailModel.create(rest);
        }
        console.log('[Daisy DB] Seeded demo users and emails in MongoDB.');
      }
      return { isMongo: true };
    } catch (err: any) {
      console.warn(`[Daisy DB] MongoDB connection failed (${err.message}). Falling back to local persistent JSON store.`);
      isMongoConnected = false;
    }
  }

  // Local JSON Store Fallback
  memoryStore = readJsonStore();
  if (memoryStore.users.length === 0) {
    console.log('[Daisy DB] Initializing persistent local JSON store (data/daisy-store.json)...');
    const seedUsers = await getSeedUsers();
    const seedEmails = getSeedEmails();
    memoryStore = {
      users: seedUsers,
      emails: seedEmails,
    };
    writeJsonStore(memoryStore);
    console.log('[Daisy DB] Starter account (Shivani) seeded in data/daisy-store.json.');
  } else {
    console.log(`[Daisy DB] Loaded ${memoryStore.users.length} users and ${memoryStore.emails.length} emails from local store.`);
  }

  return { isMongo: false };
}

// ----------------- Repository Functions -----------------
export async function findUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  if (isMongoConnected) {
    const doc = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      avatar: doc.avatar,
      role: doc.role,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
    };
  }

  const user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  return user ? { ...user } : null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (isMongoConnected) {
    const doc = await UserModel.findById(id).lean();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      avatar: doc.avatar,
      role: doc.role,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
    };
  }

  const user = memoryStore.users.find((u) => u.id === id);
  return user ? { ...user } : null;
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: string;
  preferences?: Partial<UserPreferences>;
}): Promise<User> {
  const normalizedEmail = userData.email.toLowerCase().trim();
  const defaultPrefs: UserPreferences = {
    autoAnnounce: true,
    muted: false,
    voiceRate: 1.0,
    voicePitch: 1.0,
    selectedVoiceURI: '',
    ...userData.preferences,
  };

  if (isMongoConnected) {
    const doc = await UserModel.create({
      name: userData.name,
      email: normalizedEmail,
      password: userData.password,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      role: userData.role || 'Member',
      preferences: defaultPrefs,
      createdAt: new Date().toISOString(),
    });
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      avatar: doc.avatar,
      role: doc.role,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
    };
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: userData.name,
    email: normalizedEmail,
    password: userData.password,
    avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    role: userData.role || 'Member',
    preferences: defaultPrefs,
    createdAt: new Date().toISOString(),
  };

  memoryStore.users.push(newUser);
  writeJsonStore(memoryStore);
  return newUser;
}

export async function updateUserPreferences(
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<User | null> {
  if (isMongoConnected) {
    const doc = await UserModel.findById(userId);
    if (!doc) return null;
    doc.preferences = { ...doc.preferences, ...prefs };
    await doc.save();
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      avatar: doc.avatar,
      role: doc.role,
      preferences: doc.preferences,
      createdAt: doc.createdAt,
    };
  }

  const index = memoryStore.users.findIndex((u) => u.id === userId);
  if (index === -1) return null;
  memoryStore.users[index].preferences = {
    ...memoryStore.users[index].preferences,
    ...prefs,
  };
  writeJsonStore(memoryStore);
  return { ...memoryStore.users[index] };
}

export async function getAllUsers(): Promise<User[]> {
  if (isMongoConnected) {
    const docs = await UserModel.find({}, { password: 0 }).lean();
    return docs.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      email: d.email,
      avatar: d.avatar,
      role: d.role,
      preferences: d.preferences,
      createdAt: d.createdAt,
    }));
  }

  return memoryStore.users.map(({ password, ...rest }) => ({ ...rest }));
}

export async function saveEmail(emailData: {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  messageId: string;
  smtpResponse: string;
  deliveryStatus?: 'delivered' | 'pending' | 'failed';
}): Promise<Email> {
  const newEmail: Email = {
    id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    from: emailData.from.toLowerCase().trim(),
    fromName: emailData.fromName,
    to: emailData.to.toLowerCase().trim(),
    toName: emailData.toName,
    subject: emailData.subject,
    body: emailData.body,
    isRead: false,
    isStarred: false,
    messageId: emailData.messageId,
    smtpResponse: emailData.smtpResponse,
    deliveryStatus: emailData.deliveryStatus || 'delivered',
    createdAt: new Date().toISOString(),
  };

  if (isMongoConnected) {
    const doc = await EmailModel.create(newEmail);
    return {
      id: doc._id.toString(),
      from: doc.from,
      fromName: doc.fromName,
      to: doc.to,
      toName: doc.toName,
      subject: doc.subject,
      body: doc.body,
      isRead: doc.isRead,
      isStarred: doc.isStarred,
      messageId: doc.messageId,
      smtpResponse: doc.smtpResponse,
      deliveryStatus: doc.deliveryStatus as any,
      createdAt: doc.createdAt,
    };
  }

  memoryStore.emails.unshift(newEmail);
  writeJsonStore(memoryStore);
  return newEmail;
}

export async function getEmailsForUser(userEmail: string): Promise<{
  inbox: Email[];
  sent: Email[];
  unreadCount: number;
}> {
  const normalized = userEmail.toLowerCase().trim();

  if (isMongoConnected) {
    const inboxDocs = await EmailModel.find({ to: normalized }).sort({ createdAt: -1 }).lean();
    const sentDocs = await EmailModel.find({ from: normalized }).sort({ createdAt: -1 }).lean();

    const inbox: Email[] = inboxDocs.map((d) => ({
      id: d._id.toString(),
      from: d.from,
      fromName: d.fromName,
      to: d.to,
      toName: d.toName,
      subject: d.subject,
      body: d.body,
      isRead: d.isRead,
      isStarred: d.isStarred,
      messageId: d.messageId,
      smtpResponse: d.smtpResponse,
      deliveryStatus: d.deliveryStatus as any,
      createdAt: d.createdAt,
    }));

    const sent: Email[] = sentDocs.map((d) => ({
      id: d._id.toString(),
      from: d.from,
      fromName: d.fromName,
      to: d.to,
      toName: d.toName,
      subject: d.subject,
      body: d.body,
      isRead: d.isRead,
      isStarred: d.isStarred,
      messageId: d.messageId,
      smtpResponse: d.smtpResponse,
      deliveryStatus: d.deliveryStatus as any,
      createdAt: d.createdAt,
    }));

    const unreadCount = inbox.filter((m) => !m.isRead).length;
    return { inbox, sent, unreadCount };
  }

  const inbox = memoryStore.emails.filter((m) => m.to.toLowerCase() === normalized);
  const sent = memoryStore.emails.filter((m) => m.from.toLowerCase() === normalized);
  const unreadCount = inbox.filter((m) => !m.isRead).length;

  return { inbox, sent, unreadCount };
}

export async function getEmailById(id: string): Promise<Email | null> {
  if (isMongoConnected) {
    const doc = await EmailModel.findById(id).lean();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      from: doc.from,
      fromName: doc.fromName,
      to: doc.to,
      toName: doc.toName,
      subject: doc.subject,
      body: doc.body,
      isRead: doc.isRead,
      isStarred: doc.isStarred,
      messageId: doc.messageId,
      smtpResponse: doc.smtpResponse,
      deliveryStatus: doc.deliveryStatus as any,
      createdAt: doc.createdAt,
    };
  }

  const email = memoryStore.emails.find((e) => e.id === id);
  return email ? { ...email } : null;
}

export async function markEmailAsRead(id: string, isRead: boolean): Promise<Email | null> {
  if (isMongoConnected) {
    const doc = await EmailModel.findById(id);
    if (!doc) return null;
    doc.isRead = isRead;
    await doc.save();
    return {
      id: doc._id.toString(),
      from: doc.from,
      fromName: doc.fromName,
      to: doc.to,
      toName: doc.toName,
      subject: doc.subject,
      body: doc.body,
      isRead: doc.isRead,
      isStarred: doc.isStarred,
      messageId: doc.messageId,
      smtpResponse: doc.smtpResponse,
      deliveryStatus: doc.deliveryStatus as any,
      createdAt: doc.createdAt,
    };
  }

  const email = memoryStore.emails.find((e) => e.id === id);
  if (!email) return null;
  email.isRead = isRead;
  writeJsonStore(memoryStore);
  return { ...email };
}

export async function toggleEmailStarred(id: string): Promise<Email | null> {
  if (isMongoConnected) {
    const doc = await EmailModel.findById(id);
    if (!doc) return null;
    doc.isStarred = !doc.isStarred;
    await doc.save();
    return {
      id: doc._id.toString(),
      from: doc.from,
      fromName: doc.fromName,
      to: doc.to,
      toName: doc.toName,
      subject: doc.subject,
      body: doc.body,
      isRead: doc.isRead,
      isStarred: doc.isStarred,
      messageId: doc.messageId,
      smtpResponse: doc.smtpResponse,
      deliveryStatus: doc.deliveryStatus as any,
      createdAt: doc.createdAt,
    };
  }

  const email = memoryStore.emails.find((e) => e.id === id);
  if (!email) return null;
  email.isStarred = !email.isStarred;
  writeJsonStore(memoryStore);
  return { ...email };
}

export async function deleteEmail(id: string, userEmail: string): Promise<boolean> {
  const normalized = userEmail.toLowerCase().trim();

  if (isMongoConnected) {
    const doc = await EmailModel.findById(id);
    if (!doc) return false;
    // Allow deleting if user is recipient or sender
    if (doc.to.toLowerCase() === normalized || doc.from.toLowerCase() === normalized) {
      await EmailModel.findByIdAndDelete(id);
      return true;
    }
    return false;
  }

  const index = memoryStore.emails.findIndex(
    (e) => e.id === id && (e.to.toLowerCase() === normalized || e.from.toLowerCase() === normalized)
  );

  if (index === -1) return false;
  memoryStore.emails.splice(index, 1);
  writeJsonStore(memoryStore);
  return true;
}
