export interface AuthFormData {
  username: string;
}

export interface AuthFormProps {
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export interface AuthFormState {
  isSubmitting: boolean;
  error: string | null;
}

export interface UserSession {
  user: {
    id: string;
    username: string;
    isConnected: boolean;
    currentBoardId?: string;
  };
}

export interface UserConnection {
  userId: string;
  username: string;
  boardId?: string;
  isConnected: boolean;
}
