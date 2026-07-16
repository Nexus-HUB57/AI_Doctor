import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';

// Mock AuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    RESEARCHER: 'researcher',
    ADMIN: 'admin',
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<LoginPage />);
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    expect(screen.getByText('Faça login para acessar a plataforma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renders logo and title', () => {
    render(<LoginPage />);
    expect(screen.getByText('AI Doctor')).toBeInTheDocument();
    expect(screen.getByText('Plataforma de Inteligência Artificial Médica')).toBeInTheDocument();
  });

  it('renders email and password fields in login mode', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mínimo 6 caracteres/i)).toBeInTheDocument();
  });

  it('renders test credentials section in login mode', () => {
    render(<LoginPage />);
    expect(screen.getByText('Credenciais de Teste')).toBeInTheDocument();
    expect(screen.getByText(/patient@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/doctor@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/researcher@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/admin@example.com/)).toBeInTheDocument();
  });

  it('toggles to register mode when "Registre-se" is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /registre-se/i }));
    expect(screen.getByText('Criar sua conta')).toBeInTheDocument();
    expect(screen.getByText('Preencha os dados para se registrar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('shows name field in register mode', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /registre-se/i }));
    expect(screen.getByPlaceholderText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Nome Completo')).toBeInTheDocument();
  });

  it('shows role selector in register mode with 3 options', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /registre-se/i }));
    expect(screen.getByText('Tipo de Usuário')).toBeInTheDocument();
    expect(screen.getByText('Paciente')).toBeInTheDocument();
    expect(screen.getByText('Médico')).toBeInTheDocument();
    expect(screen.getByText('Pesquisador')).toBeInTheDocument();
  });

  it('toggles back to login mode when "Faça login" is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /registre-se/i }));
    await user.click(screen.getByRole('button', { name: /faça login/i }));
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
  });

  it('allows typing in email and password fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const passwordInput = screen.getByPlaceholderText(/mínimo 6 caracteres/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls login with email and password on submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'doctor@example.com');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('doctor@example.com', 'password123');
    });
  });

  it('shows error message when login fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Credenciais inválidas'));
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'wrong@email.com');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('calls register with all fields on register submit', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    render(<LoginPage />);
    // Switch to register
    await user.click(screen.getByRole('button', { name: /registre-se/i }));
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'new@email.com');
    await user.type(screen.getByPlaceholderText('João Silva'), 'João Silva');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    // Select Médico role
    await user.click(screen.getByText('Médico'));
    await user.click(screen.getByRole('button', { name: /criar conta/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'new@email.com',
        'João Silva',
        'password123',
        'doctor'
      );
    });
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();
    // Make login hang (never resolve)
    mockLogin.mockImplementation(() => new Promise(() => {}));
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'test@email.com');
    await user.type(screen.getByPlaceholderText(/mínimo 6 caracteres/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    // Button should be disabled during loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
    });
  });

  it('renders version info in footer', () => {
    render(<LoginPage />);
    expect(screen.getByText(/AI Doctor v3.0/)).toBeInTheDocument();
  });
});