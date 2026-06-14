export type AdminUser = {
  userId: string;
  firstName: string;
  lastName: string;
  whatsappNumber?: string | null;
  mobileNumber?: string | null;
  telegramAccount?: string | null;
  initials: string;
  hasOpenAiKey: boolean;
};

export type AuthStatus = {
  setupComplete: boolean;
  authenticated: boolean;
  user: AdminUser | null;
};
