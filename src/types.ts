export interface UserPreferences {
  autoAnnounce: boolean;
  muted: boolean;
  voiceRate: number;
  voicePitch: number;
  selectedVoiceURI: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface Email {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred?: boolean;
  messageId: string;
  smtpResponse: string;
  deliveryStatus: 'delivered' | 'pending' | 'failed';
  createdAt: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  isOnline: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EmailsResponse {
  inbox: Email[];
  sent: Email[];
  unreadCount: number;
}
