# Implementação de Segurança - Fase 8

## Visão Geral

A Fase 8 do AI_Doctor implementa um sistema robusto de segurança que inclui autenticação baseada em JWT, autorização com controle de acesso baseado em papéis (RBAC), e integração segura com Amazon S3 para armazenamento de dados sensíveis.

## 1. Sistema de Autenticação (JWT)

### Características

- **JWT (JSON Web Tokens)**: Tokens seguros e sem estado para autenticação
- **Expiração de Token**: Tokens expiram após 24 horas
- **Hash de Senha**: Senhas são criptografadas usando bcryptjs com 10 rounds de salt
- **Validação de Email**: Emails únicos e validados

### Fluxo de Autenticação

```
1. Usuário faz login com email e senha
2. Servidor valida credenciais
3. Servidor gera JWT token
4. Cliente armazena token no localStorage
5. Cliente envia token em cada requisição (header Authorization: Bearer <token>)
6. Servidor valida token antes de processar requisição
```

### Endpoints de Autenticação

#### Registro
```typescript
POST /trpc/auth.register
{
  email: "user@example.com",
  name: "João Silva",
  password: "password123",
  role: "patient" | "doctor" | "researcher"
}

Response:
{
  success: true,
  user: { id, email, name, role },
  token: "jwt_token_here"
}
```

#### Login
```typescript
POST /trpc/auth.login
{
  email: "user@example.com",
  password: "password123"
}

Response:
{
  success: true,
  user: { id, email, name, role },
  token: "jwt_token_here"
}
```

#### Verificar Autenticação
```typescript
GET /trpc/auth.me
Query: { token: "jwt_token_here" }

Response:
{
  user: { id, email, name, role },
  isAuthenticated: true
}
```

## 2. Sistema de Autorização (RBAC)

### Papéis de Usuário

#### 1. **Paciente** (patient)
- Permissões:
  - `read:own_data` - Ler seus próprios dados
  - `read:diagnoses` - Ler diagnósticos
  - `read:treatments` - Ler tratamentos
  - `read:recommendations` - Ler recomendações
  - `write:feedback` - Escrever feedback
  - `read:telemedicine` - Acessar telemedicina

#### 2. **Médico** (doctor)
- Permissões:
  - `read:all_patients` - Ler dados de todos os pacientes
  - `write:diagnoses` - Criar/editar diagnósticos
  - `write:treatments` - Criar/editar tratamentos
  - `write:recommendations` - Criar recomendações
  - `read:research` - Ler pesquisa
  - `write:medical_board` - Participar da junta médica
  - `read:analytics` - Acessar analytics

#### 3. **Pesquisador** (researcher)
- Permissões:
  - `read:all_data` - Ler todos os dados
  - `read:research` - Ler pesquisa
  - `write:research` - Escrever pesquisa
  - `read:analytics` - Acessar analytics
  - `export:data` - Exportar dados
  - `read:genomic_data` - Ler dados genômicos

#### 4. **Administrador** (admin)
- Permissões:
  - `admin:all` - Todas as permissões

### Verificação de Permissões

```typescript
// No frontend
const { hasPermission } = useAuth();
if (hasPermission('write:diagnoses')) {
  // Mostrar botão de criar diagnóstico
}

// No backend
const hasPermission = hasPermissionTo(userRole, 'write:diagnoses');
if (!hasPermission) {
  throw new Error('Acesso negado');
}
```

## 3. Integração com S3

### Características de Segurança

- **Criptografia em Repouso**: AES-256
- **Criptografia em Trânsito**: HTTPS/TLS
- **URLs Pré-assinadas**: Acesso temporário com expiração
- **Controle de Acesso**: Acesso privado por padrão
- **Bloqueio de Acesso Público**: Configuração automática

### Categorias de Arquivo

1. **reports** - Relatórios clínicos
2. **genomic_data** - Dados genômicos
3. **medical_records** - Registros médicos
4. **research_data** - Dados de pesquisa

### Endpoints de S3

#### Gerar URL de Upload
```typescript
POST /trpc/s3.generateUploadUrl
{
  fileName: "report.pdf",
  fileType: "application/pdf",
  category: "reports",
  token: "jwt_token"
}

Response:
{
  success: true,
  fileKey: "reports/user_123/1234567890_report.pdf",
  uploadUrl: "https://s3.amazonaws.com/...",
  expiresIn: 900
}
```

#### Upload de Arquivo
```typescript
POST /trpc/s3.uploadFile
{
  fileName: "report.pdf",
  fileType: "application/pdf",
  fileBuffer: "base64_encoded_content",
  category: "reports",
  token: "jwt_token"
}

Response:
{
  success: true,
  file: {
    key: "reports/user_123/1234567890_report.pdf",
    url: "https://s3.amazonaws.com/...",
    fileName: "report.pdf",
    fileSize: 2048000,
    uploadedAt: "2024-01-15T10:30:00Z",
    category: "reports"
  }
}
```

#### Gerar URL de Download
```typescript
GET /trpc/s3.generateDownloadUrl
Query: {
  fileKey: "reports/user_123/1234567890_report.pdf",
  token: "jwt_token",
  expirationSeconds: 3600
}

Response:
{
  success: true,
  downloadUrl: "https://s3.amazonaws.com/...",
  expiresIn: 3600
}
```

#### Listar Arquivos
```typescript
GET /trpc/s3.listFiles
Query: {
  category: "reports",
  token: "jwt_token"
}

Response:
{
  success: true,
  files: [
    {
      key: "reports/user_123/1234567890_report.pdf",
      fileName: "report.pdf",
      fileSize: 2048000,
      uploadedAt: "2024-01-15T10:30:00Z",
      category: "reports",
      isEncrypted: true
    }
  ]
}
```

#### Deletar Arquivo
```typescript
DELETE /trpc/s3.deleteFile
{
  fileKey: "reports/user_123/1234567890_report.pdf",
  token: "jwt_token"
}

Response:
{
  success: true,
  message: "Arquivo deletado com sucesso"
}
```

## 4. Proteção contra Ataques Comuns

### CSRF (Cross-Site Request Forgery)
- Tokens JWT são únicos por sessão
- Requisições requerem token válido no header Authorization

### XSS (Cross-Site Scripting)
- Validação de entrada com Zod
- Sanitização de dados
- Content Security Policy (recomendado)

### SQL Injection
- Uso de ORM/Query Builder (futuro)
- Validação de entrada com Zod

### Força Bruta
- Limite de tentativas de login (recomendado)
- Rate limiting (recomendado)

## 5. Usuários de Teste

Para desenvolvimento e testes, os seguintes usuários estão disponíveis:

| Email | Senha | Papel |
|-------|-------|-------|
| patient@example.com | password123 | Paciente |
| doctor@example.com | password123 | Médico |
| researcher@example.com | password123 | Pesquisador |
| admin@example.com | admin123 | Administrador |

**IMPORTANTE**: Altere essas credenciais em produção!

## 6. Variáveis de Ambiente

Crie um arquivo `.env` com as seguintes variáveis:

```env
# Autenticação
JWT_SECRET=your-secret-key-change-in-production

# S3/AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=ai-doctor-files
```

## 7. Implementação no Frontend

### AuthProvider
```typescript
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Seu app aqui */}
    </AuthProvider>
  );
}
```

### Usando Autenticação
```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, token, login, logout, hasPermission } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div>
      <h1>Bem-vindo, {user.name}!</h1>
      {hasPermission('write:diagnoses') && (
        <button>Criar Diagnóstico</button>
      )}
    </div>
  );
}
```

### Usando Gerenciador de Arquivos
```typescript
import FileManager from './components/FileManager';

function App() {
  return <FileManager />;
}
```

## 8. Próximos Passos

1. **Implementar Rate Limiting**: Proteger contra força bruta
2. **Adicionar 2FA**: Autenticação de dois fatores
3. **Implementar Refresh Tokens**: Melhorar segurança de tokens
4. **Auditoria de Acesso**: Log de todas as ações
5. **Backup de Dados**: Estratégia de backup automático
6. **Conformidade HIPAA**: Para dados médicos
7. **Testes de Segurança**: Penetration testing

## 9. Referências

- [JWT.io](https://jwt.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS S3 Security](https://docs.aws.amazon.com/s3/latest/userguide/security.html)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

**Versão**: 1.0  
**Data**: 15 de Julho de 2026  
**Autor**: Manus AI
