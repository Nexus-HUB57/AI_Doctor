import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Heart,
  MessageCircle,
  Sparkles,
  Clock,
  Users,
  Shield,
  Lightbulb,
  TrendingUp,
  Smile
} from 'lucide-react';

interface Message {
  id: string;
  type: 'patient' | 'consensus' | 'system';
  content: string;
  timestamp: string;
  sender?: string;
  hope_level?: number;
  evidence_score?: number;
}

interface ConsensusResponse {
  main_message: string;
  key_points: string[];
  hope_indicator: number;
  evidence_strength: string;
  next_steps: string[];
  specialist_insights: Array<{
    specialty: string;
    perspective: string;
  }>;
}

export default function TelemedicineChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Bem-vindo ao AI_Doctor Telemedicina. Aqui, você não está sozinho. Cada pergunta será cuidadosamente considerada por nossa junta médica de especialistas PhD. Compartilhe suas dúvidas, medos e esperanças. Estamos aqui para oferecer orientação científica, acolhimento e esperança.',
      timestamp: new Date().toISOString(),
      hope_level: 100
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'greeting' | 'listening' | 'consensus' | 'support'>('greeting');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add patient message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'patient',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setSessionPhase('consensus');

    try {
      // Call consensus endpoint via tRPC
      const result = await trpc.telemedicine.chat.mutate({
        message: inputValue,
        history: messages.map(m => ({
          role: m.type === 'patient' ? 'user' : 'assistant',
          content: m.content
        }))
      });

      const consensusResponse: ConsensusResponse = {
        main_message: result.response,
        key_points: result.keyPoints || [],
        hope_indicator: result.hopeScore || 90,
        evidence_strength: result.evidenceLevel || 'Alta',
        next_steps: result.nextSteps || [],
        specialist_insights: []
      };

      // Add consensus message
      const consensusMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'consensus',
        content: consensusResponse.main_message,
        timestamp: new Date().toISOString(),
        hope_level: consensusResponse.hope_indicator,
        evidence_score: consensusResponse.evidence_strength === 'Alta' ? 95 : 75,
        sender: 'Junta Médica Consensus',
        ...consensusResponse
      };

      setMessages(prev => [...prev, consensusMessage]);
      setSessionPhase('support');
    } catch (error) {
      console.error('Error getting consensus response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'consensus',
        content: 'Desculpe, houve um erro ao processar sua pergunta. Por favor, tente novamente. Estamos aqui para ajudar.',
        timestamp: new Date().toISOString(),
        hope_level: 75
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockConsensus = (userMessage: string): ConsensusResponse => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('cura') || lowerMessage.includes('esperança')) {
      return {
        main_message: 'Sua pergunta reflete uma esperança genuína, e queremos que você saiba: essa esperança é fundamentada em ciência. Os avanços na oncologia nos últimos 5 anos foram extraordinários. Terapias como CAR-T, checkpoint inhibidores e nanotecnologia estão transformando vidas todos os dias. A cura não é apenas possível – ela está acontecendo agora em laboratórios e consultórios ao redor do mundo. Cada paciente é único, e cada caso oferece novas oportunidades de sucesso.',
        key_points: [
          'Taxa de resposta completa em imunoterapia: 30-40%',
          'Sobrevida em 5 anos aumentou 45% em últimos 10 anos',
          'Novas terapias aprovadas a cada 3-6 meses',
          'Medicina de precisão personaliza tratamento para cada paciente'
        ],
        hope_indicator: 95,
        evidence_strength: 'Alta',
        next_steps: [
          'Consultar com oncologista para avaliação completa',
          'Realizar testes genômicos (sequenciamento)',
          'Explorar ensaios clínicos relevantes',
          'Buscar segunda opinião se desejar'
        ],
        specialist_insights: [
          {
            specialty: 'Imunooncologia',
            perspective: 'As terapias imunológicas estão revolucionando o tratamento. Pacientes que há 10 anos teriam prognóstico reservado hoje têm oportunidades reais de remissão completa.'
          },
          {
            specialty: 'Nanotecnologia',
            perspective: 'Nanopartículas permitem entrega direcionada de fármacos, aumentando eficácia e reduzindo efeitos colaterais. É medicina de precisão em ação.'
          },
          {
            specialty: 'Oncologia Molecular',
            perspective: 'Compreender as mutações do tumor permite escolher exatamente o tratamento mais eficaz. Personalizamos a medicina para você.'
          }
        ]
      };
    } else if (lowerMessage.includes('medo') || lowerMessage.includes('assustado')) {
      return {
        main_message: 'É completamente natural sentir medo. Mas queremos que você saiba que o medo é um sinal de que você se importa com sua vida – e isso é força. Essa força, combinada com a medicina moderna, é poderosa. Você não está sozinho nesta jornada. Nossa junta médica está aqui, seus médicos estão aqui, e comunidades de pacientes ao redor do mundo também estão. Juntos, enfrentamos desafios que parecem impossíveis e os superamos.',
        key_points: [
          'Medo é uma resposta natural e válida',
          'Informação reduz incerteza e ansiedade',
          'Suporte psicológico é parte essencial do tratamento',
          'Comunidades de pacientes oferecem força coletiva'
        ],
        hope_indicator: 85,
        evidence_strength: 'Alta',
        next_steps: [
          'Conversar com psico-oncologista',
          'Conectar-se com grupos de apoio',
          'Aprender sobre seu diagnóstico específico',
          'Estabelecer rede de suporte pessoal'
        ],
        specialist_insights: [
          {
            specialty: 'Psico-Oncologia',
            perspective: 'O bem-estar mental é fundamental. Pacientes que recebem suporte psicológico têm melhor qualidade de vida e frequentemente melhores outcomes clínicos.'
          },
          {
            specialty: 'Oncologia Clínica',
            perspective: 'Cada dia traz novas possibilidades. Planos de tratamento são dinâmicos e se adaptam conforme você progride.'
          }
        ]
      };
    } else if (lowerMessage.includes('tratamento') || lowerMessage.includes('opção')) {
      return {
        main_message: 'Excelente pergunta. As opções de tratamento moderno são vastas e personalizadas. Dependendo do tipo específico de câncer, estágio e perfil genômico, você pode ter acesso a: terapias alvo, imunoterapia, quimioterapia de última geração, cirurgia minimamente invasiva, radioterapia de precisão, e até combinações inovadoras. O importante é que cada opção é cuidadosamente considerada por especialistas para maximizar sua chance de sucesso com qualidade de vida.',
        key_points: [
          'Tratamentos são personalizados para seu perfil',
          'Múltiplas opções geralmente disponíveis',
          'Combinações terapêuticas aumentam eficácia',
          'Tecnologia reduz efeitos colaterais'
        ],
        hope_indicator: 90,
        evidence_strength: 'Alta',
        next_steps: [
          'Realizar testes de biomarcadores',
          'Consultar oncologista especializado',
          'Revisar ensaios clínicos disponíveis',
          'Discutir plano de tratamento personalizado'
        ],
        specialist_insights: [
          {
            specialty: 'Oncologia Molecular',
            perspective: 'Mutações específicas determinam qual tratamento funcionará melhor. Isso é medicina verdadeiramente personalizada.'
          },
          {
            specialty: 'Cirurgia Oncológica',
            perspective: 'Técnicas minimamente invasivas permitem ressecção eficaz com recuperação rápida e melhor qualidade de vida.'
          }
        ]
      };
    }

    return {
      main_message: 'Sua pergunta é importante e merece uma resposta cuidadosa. Nossa junta médica está considerando sua situação com toda a atenção. O que posso dizer é que a medicina moderna oferece esperança real. Cada dia, novos avanços são feitos. Você está no caminho certo ao buscar informação e apoio.',
      key_points: [
        'Cada caso é único e merece análise personalizada',
        'Avanços científicos continuam acelerando',
        'Múltiplas especialidades trabalham juntas',
        'Esperança é fundamentada em evidência'
      ],
      hope_indicator: 80,
      evidence_strength: 'Moderada',
      next_steps: [
        'Compartilhar mais detalhes sobre sua situação',
        'Consultar com especialista relevante',
        'Explorar recursos de apoio disponíveis'
      ],
      specialist_insights: [
        {
          specialty: 'Oncologia Clínica',
          perspective: 'Cada pergunta nos aproxima de uma solução. Continue buscando informação e apoio.'
        }
      ]
    };
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-b border-cyan-800/30 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-rose-400 animate-pulse" />
            <h1 className="text-3xl font-black uppercase tracking-tight">AI_Doctor Telemedicina</h1>
          </div>
          <p className="text-sm text-cyan-200 font-mono">
            Orientação Científica • Acolhimento Humanizado • Esperança Fundamentada em Evidência
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'patient' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl rounded-xl p-4 ${
                message.type === 'patient'
                  ? 'bg-cyan-600/30 border border-cyan-500/50 rounded-br-none'
                  : message.type === 'system'
                  ? 'bg-emerald-900/30 border border-emerald-500/50 w-full'
                  : 'bg-blue-900/30 border border-blue-500/50 rounded-bl-none'
              }`}
            >
              {message.type !== 'patient' && (
                <div className="flex items-center gap-2 mb-3">
                  {message.type === 'consensus' && (
                    <>
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300 uppercase">Junta Médica Consensus</span>
                      {message.hope_level && (
                        <div className="ml-auto flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="text-xs text-amber-300">Esperança: {message.hope_level}%</span>
                        </div>
                      )}
                    </>
                  )}
                  {message.type === 'system' && (
                    <>
                      <Smile className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300 uppercase">Bem-vindo</span>
                    </>
                  )}
                </div>
              )}

              <p className="text-sm leading-relaxed text-gray-100">{message.content}</p>

              {message.type === 'consensus' && (
                <div className="mt-4 space-y-3 text-xs">
                  {/* Key Points */}
                  <div className="bg-black/30 rounded-lg p-3 border border-blue-500/20">
                    <p className="font-bold text-blue-300 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Pontos-Chave
                    </p>
                    <ul className="space-y-1">
                      {(message as any).key_points?.map((point: string, idx: number) => (
                        <li key={idx} className="text-gray-300 flex gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Evidence Strength */}
                  {message.evidence_score && (
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2 border border-blue-500/20">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-gray-300">
                        Força de Evidência: <span className="text-emerald-400 font-bold">{message.evidence_score}%</span>
                      </span>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="bg-black/30 rounded-lg p-3 border border-blue-500/20">
                    <p className="font-bold text-blue-300 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Próximos Passos
                    </p>
                    <ul className="space-y-1">
                      {(message as any).next_steps?.map((step: string, idx: number) => (
                        <li key={idx} className="text-gray-300 flex gap-2">
                          <span className="text-cyan-400">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(message.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-4 rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-sm text-blue-300">Junta Médica deliberando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-cyan-800/30 bg-slate-900/80 p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Compartilhe suas dúvidas, medos ou esperanças... Estamos aqui para ouvir e orientar."
              className="flex-1 bg-slate-800 border border-cyan-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </form>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg text-xs text-amber-200">
            <Shield className="w-3 h-3 inline mr-1" />
            <strong>Importante:</strong> Este sistema oferece orientação científica e acolhimento. Não substitui consulta médica profissional. Para diagnóstico e prescrição de tratamentos, consulte sempre um médico qualificado.
          </div>
        </div>
      </div>
    </div>
  );
}
