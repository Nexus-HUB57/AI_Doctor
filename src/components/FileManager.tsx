import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './base';
import {
  Upload, Download, Trash2, Lock, AlertCircle, CheckCircle,
  Loader, File, FolderOpen, Shield, HardDrive, FileText, Dna, FlaskConical, ClipboardList,
} from 'lucide-react';

interface FileItem {
  key: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date | string;
  category: string;
  isEncrypted: boolean;
}

type FileCategory = 'reports' | 'genomic_data' | 'medical_records' | 'research_data';

const categoryIcons: Record<FileCategory, React.ComponentType<{ className?: string }>> = {
  reports: FileText,
  genomic_data: Dna,
  medical_records: ClipboardList,
  research_data: FlaskConical,
};

const categoryColors: Record<FileCategory, string> = {
  reports: 'from-blue-500 to-cyan-500',
  genomic_data: 'from-green-500 to-emerald-500',
  medical_records: 'from-amber-500 to-orange-500',
  research_data: 'from-purple-500 to-pink-500',
};

const FileManager: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('reports');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories: { value: FileCategory; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    { value: 'reports', label: 'Relatórios', icon: FileText, description: 'Laudos e pareceres' },
    { value: 'genomic_data', label: 'Dados Genômicos', icon: Dna, description: 'Sequências e análises' },
    { value: 'medical_records', label: 'Registros Médicos', icon: ClipboardList, description: 'Prontuários' },
    { value: 'research_data', label: 'Dados de Pesquisa', icon: FlaskConical, description: 'Datasets e estudos' },
  ];

  // Carregar arquivos ao montar ou mudar categoria
  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [selectedCategory, user]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  /**
   * Carregar arquivos via API
   */
  const loadFiles = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');
      const url = new URL(`${apiUrl}/trpc/s3.listFiles`);
      url.searchParams.set('userId', user.id);
      if (selectedCategory) url.searchParams.set('category', selectedCategory);

      const response = await fetch(url.toString(), {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const data = await response.json();

      if (data.result?.data?.json?.success) {
        setFiles(data.result.data.json.files || []);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar arquivos' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Upload de arquivo
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      setMessage(null);

      // Ler arquivo como base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileBuffer = (e.target?.result as string).split(',')[1];

        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const token = localStorage.getItem('auth_token');

          const response = await fetch(`${apiUrl}/trpc/s3.uploadFile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileBuffer,
              category: selectedCategory,
              userId: user.id,
            }),
          });

          const data = await response.json();
          if (data.result?.data?.json?.success) {
            setMessage({ type: 'success', text: `"${file.name}" enviado com sucesso` });
            await loadFiles();
          } else {
            throw new Error(data.error?.message || 'Erro no upload');
          }
        } catch (err) {
          setMessage({ type: 'error', text: (err as Error).message || 'Erro ao enviar arquivo' });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setMessage({ type: 'error', text: 'Erro ao processar arquivo' });
      setIsUploading(false);
    }
  };

  /**
   * Download de arquivo
   */
  const handleDownload = async (fileKey: string, fileName: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');
      const url = new URL(`${apiUrl}/trpc/s3.generateDownloadUrl`);
      url.searchParams.set('fileKey', fileKey);
      url.searchParams.set('userId', user.id);
      url.searchParams.set('expirationSeconds', '3600');

      const response = await fetch(url.toString(), {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      const data = await response.json();

      if (data.result?.data?.json?.success) {
        const downloadUrl = data.result.data.json.downloadUrl;
        if (downloadUrl.startsWith('data:')) {
          // Base64 data URL - download direto
          const link = document.createElement('a');
          link.href = downloadUrl.split('#')[0]; // Remove expires param
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setMessage({ type: 'success', text: 'Download iniciado' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao fazer download' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Deletar arquivo
   */
  const handleDelete = async (fileKey: string, fileName: string) => {
    if (!user) return;
    if (!confirm(`Tem certeza que deseja deletar "${fileName}"?`)) return;

    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${apiUrl}/trpc/s3.uploadFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ fileKey, userId: user.id }),
      });

      // For delete, use a different approach - direct fetch to delete endpoint
      const deleteUrl = `${apiUrl}/trpc/s3.deleteFile`;
      const deleteResponse = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ fileKey, userId: user.id }),
      });

      const deleteData = await deleteResponse.json();
      if (deleteData.result?.data?.json?.success) {
        setMessage({ type: 'success', text: 'Arquivo deletado com sucesso' });
        await loadFiles();
      } else {
        throw new Error(deleteData.error?.message || 'Erro ao deletar');
      }
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Erro ao deletar arquivo' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasPermission('read:files') && !hasPermission('admin:all')) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Acesso Negado</h2>
        <p className="text-slate-400">Você não tem permissão para acessar o gerenciador de arquivos.</p>
      </Card>
    );
  }

  const CatIcon = categoryIcons[selectedCategory];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Gerenciador de Arquivos</h1>
        <p className="text-slate-400">Gerencie seus arquivos médicos e de pesquisa de forma segura</p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 animate-pulse-once ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Category Selection */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-cyan-400" />
          Categoria de Arquivo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? `border-cyan-500 bg-gradient-to-br ${categoryColors[cat.value]} bg-opacity-10 shadow-lg`
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {cat.label}
                </p>
                <p className={`text-xs mt-1 ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Upload Section */}
      {hasPermission('upload:files') || hasPermission('admin:all') ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Fazer Upload
            <span className="text-xs font-normal text-slate-500 ml-2">
              Categoria: {categories.find(c => c.value === selectedCategory)?.label}
            </span>
          </h2>
          <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-all group">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              {isUploading ? (
                <Loader className="w-10 h-10 text-cyan-400 animate-spin" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                  <Upload className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              )}
              <div>
                <p className="text-slate-300 font-medium">
                  {isUploading ? 'Enviando arquivo...' : 'Clique para selecionar ou arraste um arquivo'}
                </p>
                <p className="text-slate-500 text-sm mt-1">Máximo 100MB — Criptografia AES-256 automática</p>
              </div>
            </label>
          </div>
        </Card>
      ) : null}

      {/* Files List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-cyan-400" />
          Arquivos
          <span className="text-xs font-normal text-slate-500 ml-2">
            {files.length} arquivo{files.length !== 1 ? 's' : ''}
          </span>
        </h2>

        {isLoading && files.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum arquivo nesta categoria</p>
            <p className="text-slate-600 text-sm mt-1">Faça upload para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-slate-400 text-sm">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400 text-sm">Tamanho</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400 text-sm">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-400 text-sm">Segurança</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-400 text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.key} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <CatIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-white font-medium text-sm">{file.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{formatFileSize(file.fileSize)}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{formatDate(file.uploadedAt)}</td>
                    <td className="py-3 px-4">
                      {file.isEncrypted && (
                        <div className="flex items-center gap-1 text-green-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span className="text-xs">AES-256</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(file.key, file.fileName)}
                          disabled={isLoading}
                          className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {(hasPermission('delete:files') || hasPermission('admin:all')) && (
                          <button
                            onClick={() => handleDelete(file.key, file.fileName)}
                            disabled={isLoading}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Security Info */}
      <Card className="p-6 bg-slate-900/50 border-cyan-500/20">
        <h3 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Informações de Segurança
        </h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-green-400" />
            Todos os arquivos são criptografados com AES-256
          </li>
          <li className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-green-400" />
            Dados criptografados em repouso e em trânsito (HTTPS/TLS)
          </li>
          <li className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            Acesso controlado por autenticação JWT com RBAC
          </li>
          <li className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            URLs de download expiram após 1 hora
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default FileManager;