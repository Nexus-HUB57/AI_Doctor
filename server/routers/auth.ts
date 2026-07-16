import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  listUsers,
  generateToken,
  comparePassword,
  UserRole,
  hasPermissionTo,
  seedUsers,
} from '../auth';

/**
 * Seed de usuários de teste ao importar o router
 */
seedUsers();

/**
 * Router de Autenticação
 */
export const authRouter = router({
  /**
   * Login de usuário
   */
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);

      if (!user) {
        throw new Error('Email ou senha incorretos');
      }

      if (!user.isActive) {
        throw new Error('Conta desativada. Entre em contato com o administrador.');
      }

      const isValid = await comparePassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new Error('Email ou senha incorretos');
      }

      const token = generateToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    }),

  /**
   * Registro de novo usuário
   */
  register: publicProcedure
    .input(RegisterSchema)
    .mutation(async ({ input }) => {
      try {
        const user = await createUser(input.email, input.name, input.password, input.role);
        const token = generateToken(user);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        };
      } catch (error) {
        throw new Error((error as Error).message || 'Erro ao criar conta');
      }
    }),

  /**
   * Verificar autenticação via token
   */
  me: publicProcedure
    .input(z.object({ token: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      // Tenta obter do contexto (header) ou do input (query param)
      const userId = ctx.user?.userId;
      const token = input.token;

      if (userId) {
        // Token já verificado pelo contexto
        const user = await getUserById(userId);
        if (!user) {
          return { user: null, isAuthenticated: false };
        }
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          isAuthenticated: true,
        };
      }

      // Fallback: verificar token passado explicitamente
      if (token) {
        const { verifyToken } = await import('../auth');
        const payload = verifyToken(token);
        if (payload) {
          const user = await getUserById(payload.userId);
          if (user) {
            return {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
              isAuthenticated: true,
            };
          }
        }
      }

      return { user: null, isAuthenticated: false };
    }),

  /**
   * Alterar senha
   */
  changePassword: publicProcedure
    .input(ChangePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error('Não autenticado');
      }

      const user = await getUserById(ctx.user.userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const isValid = await comparePassword(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new Error('Senha atual incorreta');
      }

      const { hashPassword } = await import('../auth');
      const newHash = await hashPassword(input.newPassword);
      await updateUser(user.id, { passwordHash: newHash });

      return { success: true, message: 'Senha alterada com sucesso' };
    }),

  /**
   * Verificar permissão do usuário
   */
  checkPermission: publicProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        return { hasPermission: false };
      }
      return {
        hasPermission: hasPermissionTo(ctx.user.role, input.permission),
      };
    }),

  /**
   * Listar usuários (apenas admin)
   */
  listUsers: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error('Não autenticado');
      }
      if (ctx.user.role !== UserRole.ADMIN) {
        throw new Error('Acesso negado. Apenas administradores podem listar usuários.');
      }
      return { success: true, users: await listUsers() };
    }),

  /**
   * Informações sobre os papéis e permissões
   */
  rolesInfo: publicProcedure
    .query(() => {
      return {
        roles: {
          [UserRole.PATIENT]: {
            label: 'Paciente',
            description: 'Acesso aos seus próprios dados médicos',
          },
          [UserRole.DOCTOR]: {
            label: 'Médico',
            description: 'Acesso completo a dados de pacientes e diagnósticos',
          },
          [UserRole.RESEARCHER]: {
            label: 'Pesquisador',
            description: 'Acesso a dados de pesquisa e genômicos',
          },
          [UserRole.ADMIN]: {
            label: 'Administrador',
            description: 'Acesso total ao sistema',
          },
        },
      };
    }),
});