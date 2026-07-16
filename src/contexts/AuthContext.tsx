import React, { createContext, useContext, useState, useEffect } from 'react';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  RESEARCHER = 'researcher',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Permissões por papel
 */
const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.PATIENT]: [
    'read:own_data',
    'read:diagnoses',
    'read:treatments',
    'read:recommendations',
    'write:feedback',
    'read:telemedicine',
    'read:files',
    'upload:files',
  ],
  [UserRole.DOCTOR]: [
    'read:all_patients',
    'write:diagnoses',
    'write:treatments',
    'write:recommendations',
    'read:research',
    'write:medical_board',
    'read:analytics',
    'read:files',
    'upload:files',
    'download:files',
    'delete:files',
  ],
  [UserRole.RESEARCHER]: [
    'read:all_data',
    'read:research',
    'write:research',
    'read:analytics',
    'export:data',
    'read:genomic_data',
    'read:files',
    'upload:files',
    'download:files',
  ],
  [UserRole.ADMIN]: [
    'admin:all',
    'manage:users',
    'manage:roles',
    'manage:system',
    'read:logs',
    'manage:s3',
  ],
};

/**
 * Labels para exibição dos papéis
 */
export const roleLabels: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'Paciente',
  [UserRole.DOCTOR]: 'Médico(a)',
  [UserRole.RESEARCHER]: 'Pesquisador(a)',
  [UserRole.ADMIN]: 'Administrador(a)',
};

/**
 * AuthProvider - Provedor de autenticação
 * Gerencia estado de login, token JWT e permissões RBAC
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar token do localStorage ao montar
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verificar token com o servidor
   */
  const verifyToken = async (authToken: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/trpc/auth.me?token=${encodeURIComponent(authToken)}`);
      const data = await response.json();

      if (data.result?.data?.json?.isAuthenticated && data.result?.data?.json?.user) {
        const userData = data.result.data.json.user;
        setUser(userData);
        setToken(authToken);
      } else {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/trpc/auth.login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.result?.data?.json?.success) {
        const result = data.result.data.json;
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('auth_token', result.token);
      } else {
        const errorMsg = data.error?.message || 'Erro ao fazer login';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registrar
   */
  const register = async (email: string, name: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/trpc/auth.register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      });

      const data = await response.json();

      if (data.result?.data?.json?.success) {
        const result = data.result.data.json;
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('auth_token', result.token);
      } else {
        const errorMsg = data.error?.message || 'Erro ao registrar';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  /**
   * Verificar permissão do usuário atual
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission) || permissions.includes('admin:all');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar autenticação
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};