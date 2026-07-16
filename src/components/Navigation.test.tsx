import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock NavigationContext
const mockSetActiveTab = vi.fn();
const mockSetSidebarOpen = vi.fn();

vi.mock('../contexts/NavigationContext', () => ({
  useNavigation: () => ({
    activeTab: 'dashboard' as any,
    setActiveTab: mockSetActiveTab,
    sidebarOpen: true,
    setSidebarOpen: mockSetSidebarOpen,
    previousTab: null,
  }),
}));

// Mock AuthContext
const mockLogout = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user_1',
      email: 'doctor@example.com',
      name: 'Dr. Test',
      role: 'doctor',
    },
    token: 'jwt_token_123',
    isAuthenticated: true,
    isLoading: false,
    logout: mockLogout,
    hasPermission: (perm: string) => {
      const perms = ['read:all_patients', 'write:diagnoses', 'read:files', 'upload:files', 'download:files', 'delete:files', 'read:research', 'write:medical_board', 'read:analytics'];
      return perms.includes(perm);
    },
  }),
  roleLabels: {
    patient: 'Paciente',
    doctor: 'Médico(a)',
    researcher: 'Pesquisador(a)',
    admin: 'Administrador(a)',
  },
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    RESEARCHER: 'researcher',
    ADMIN: 'admin',
  },
}));

import Sidebar from './Sidebar';
import TopBar from './TopBar';

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the AI_Doctor logo', () => {
    render(<Sidebar />);
    expect(screen.getByText('AI_Doctor')).toBeInTheDocument();
  });

  it('renders "Módulos Principais" section header', () => {
    render(<Sidebar />);
    expect(screen.getByText('Módulos Principais')).toBeInTheDocument();
  });

  it('renders main navigation modules', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard Hub')).toBeInTheDocument();
    expect(screen.getByText('Diagnóstico Assistido')).toBeInTheDocument();
    expect(screen.getByText('Junta Médica PhD')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders "Avançado" section header', () => {
    render(<Sidebar />);
    expect(screen.getByText('Avançado')).toBeInTheDocument();
  });

  it('renders user info in profile card', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dr. Test')).toBeInTheDocument();
    expect(screen.getByText('doctor@example.com')).toBeInTheDocument();
  });

  it('renders role badge', () => {
    render(<Sidebar />);
    expect(screen.getByText('Médico(a)')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<Sidebar />);
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('calls setActiveTab when a module is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByText('Junta Médica PhD'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('board');
  });

  it('calls logout when Sair is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByText('Sair'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

describe('TopBar Component', () => {
  it('renders search input', () => {
    render(<TopBar />);
    // TopBar has a search input
    const input = document.querySelector('input[type="text"]') || document.querySelector('input');
    expect(input).toBeInTheDocument();
  });

  it('renders user name', () => {
    render(<TopBar />);
    expect(screen.getByText('Dr. Test')).toBeInTheDocument();
  });

  it('renders role badge', () => {
    render(<TopBar />);
    expect(screen.getByText('Médico(a)')).toBeInTheDocument();
  });

  it('renders system online status', () => {
    render(<TopBar />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders notification bell button', () => {
    render(<TopBar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});