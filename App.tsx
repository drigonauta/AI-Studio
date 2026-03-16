
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageSize, Campaign, Language, Template, CampaignMetrics } from './types';
import { generateEmailCampaign, generateCampaignImage } from './services/geminiService';
import { Button } from './components/Button';
import { ChatWidget } from './components/ChatWidget';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('pt');
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [styleInstructions, setStyleInstructions] = useState('');
  const [selectedStyleTag, setSelectedStyleTag] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipients, setRecipients] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sendProgress, setSendProgress] = useState<{current: number, total: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [history, setHistory] = useState<Campaign[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'create' | 'history'>('create');
  const [isApiKeyChecking, setIsApiKeyChecking] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  const templates: Template[] = [
    { 
      id: 'welcome', 
      name: { en: 'Welcome Email', pt: 'Boas-vindas' }, 
      icon: '👋', 
      basePrompt: { 
        en: 'A warm welcome email for new subscribers, introducing our values and offering a discount.', 
        pt: 'Um e-mail de boas-vindas caloroso para novos inscritos, apresentando nossos valores e oferecendo um desconto.' 
      },
      description: { en: 'Build trust with new members.', pt: 'Crie confiança com novos membros.' }
    },
    { 
      id: 'launch', 
      name: { en: 'Product Launch', pt: 'Lançamento' }, 
      icon: '🚀', 
      basePrompt: { 
        en: 'Exciting announcement for a new product release with key features and early bird pricing.', 
        pt: 'Anúncio empolgante para o lançamento de um novo produto com recursos principais e preço antecipado.' 
      },
      description: { en: 'Drive hype and first sales.', pt: 'Gere expectativa e primeiras vendas.' }
    },
    { 
      id: 'sale', 
      name: { en: 'Flash Sale', pt: 'Oferta Relâmpago' }, 
      icon: '⚡', 
      basePrompt: { 
        en: 'High-urgency 24-hour flash sale announcement with a bold discount and clear countdown.', 
        pt: 'Anúncio de oferta relâmpago de 24 horas com alta urgência, desconto ousado e contagem regressiva clara.' 
      },
      description: { en: 'Quick conversion boost.', pt: 'Aumento rápido de conversão.' }
    },
    { 
      id: 'newsletter', 
      name: { en: 'Newsletter', pt: 'Boletim' }, 
      icon: '📰', 
      basePrompt: { 
        en: 'A weekly curation of top stories, tips, and community highlights.', 
        pt: 'Uma curadoria semanal das principais histórias, dicas e destaques da comunidade.' 
      },
      description: { en: 'Keep your audience engaged.', pt: 'Mantenha seu público engajado.' }
    },
  ];

  const quickStyles = [
    { id: 'photo', label: { pt: 'Fotorealista', en: 'Photorealistic' }, value: 'High-end commercial photography, shallow depth of field, 8k, professional lighting' },
    { id: 'minimal', label: { pt: 'Minimalista', en: 'Minimalist' }, value: 'Clean, minimalist design, plenty of negative space, vector aesthetic, muted colors' },
    { id: '3d', label: { pt: '3D / Render', en: '3D Render' }, value: '3D isometric render, Octane render, claymation style, playful and modern' },
    { id: 'illustration', label: { pt: 'Ilustração', en: 'Illustration' }, value: 'Hand-drawn digital illustration, textured, artistic, expressive colors' },
    { id: 'cyber', label: { pt: 'Futurista', en: 'Futuristic' }, value: 'Cyberpunk aesthetic, neon accents, high-tech vibe, dark contrast' },
  ];

  const qualityTiers = [
    { 
      id: '1K', 
      label: { pt: 'Padrão', en: 'Standard' }, 
      res: '1K', 
      sub: { pt: 'Equilibrado', en: 'Balanced' },
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-md'
    },
    { 
      id: '2K', 
      label: { pt: 'Alta', en: 'High' }, 
      res: '2K', 
      sub: { pt: 'Profissional', en: 'Pro Fidelity' },
      activeClass: 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200'
    },
    { 
      id: '4K', 
      label: { pt: 'Ultra', en: 'Ultra' }, 
      res: '4K', 
      sub: { pt: 'Premium', en: 'Ultra Detail' },
      activeClass: 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-600 text-white shadow-lg shadow-amber-200 ring-2 ring-amber-500/20'
    },
  ];

  const t = {
    pt: {
      title: "EmailGenius AI",
      architect: "Arquiteto",
      history: "Histórico",
      templatesLabel: "Biblioteca de Templates",
      goalLabel: "Qual é o objetivo?",
      goalPlaceholder: "ex: Campanha de liquidação de verão para nossos novos tênis sustentáveis...",
      qualityLabel: "Qualidade Visual",
      styleLabel: "Estilo & Instruções Visuais",
      stylePlaceholder: "ex: Tons pastel, estilo editorial...",
      quickStyleLabel: "Estilos Rápidos",
      generateBtn: "Gerar Campanha",
      recentGen: "Gerações Recentes",
      noCampaigns: "Nenhuma campanha ainda.",
      subject: "Assunto:",
      unsubscribe: "Cancelar Inscrição",
      viewBrowser: "Ver no Navegador",
      emptyStateTitle: "Pronto para lançar sua campanha?",
      emptyStateDesc: "Escolha um template ou descreva seu objetivo para começar.",
      loadingVisuals: "Gemini está desenhando seus visuais...",
      apiKeyBtn: "Conectar API Key",
      statusReady: "IA Pronta",
      init: "Inicializando EmailGenius AI...",
      billingMsg: "Configuração de Faturamento necessária.",
      sendBtn: "Enviar Campanha",
      sendWhatsAppBtn: "Enviar via WhatsApp",
      sendModalTitle: "Enviar para Destinatários",
      whatsappLabel: "Número do WhatsApp (com DDD)",
      whatsappPlaceholder: "ex: 5511999999999",
      whatsappShareMsg: "Compartilhar via WhatsApp",
      recipientsLabel: "E-mails dos Destinatários",
      recipientsPlaceholder: "email1@exemplo.com...",
      confirmSend: "Confirmar Envio",
      sendingMsg: "Enviando... {current} de {total}",
      sendSuccess: "Campanha enviada!",
      cancel: "Cancelar",
      historyItemDate: "Gerado em",
      language: "Idioma",
      ctaSettings: "Configurar Botão",
      ctaLabelText: "Texto do Botão",
      ctaLabelUrl: "Link de Destino (URL)",
      performanceMetrics: "Métricas de Desempenho",
      openRate: "Taxa de Abertura",
      ctr: "Taxa de Cliques (CTR)",
      sent: "Enviados",
      delivered: "Entregues",
      pendingStats: "Estatísticas pendentes após o envio",
      scheduleLabel: "Agendar Entrega",
      scheduleDate: "Data",
      scheduleTime: "Hora",
      scheduleBtn: "Agendar Campanha",
      scheduledMsg: "Campanha agendada para {date}",
      statusScheduled: "Agendado"
    },
    en: {
      title: "EmailGenius AI",
      architect: "Architect",
      history: "History",
      templatesLabel: "Templates Library",
      goalLabel: "What's the goal?",
      goalPlaceholder: "e.g. Summer sale campaign for our new sustainable sneakers...",
      qualityLabel: "Visual Quality",
      styleLabel: "Visual Style & Instructions",
      stylePlaceholder: "e.g. Pastel tones, editorial style...",
      quickStyleLabel: "Quick Styles",
      generateBtn: "Generate Campaign",
      recentGen: "Recent Generations",
      noCampaigns: "No previous campaigns yet.",
      subject: "Subject:",
      unsubscribe: "Unsubscribe",
      viewBrowser: "View in Browser",
      emptyStateTitle: "Ready to launch your campaign?",
      emptyStateDesc: "Choose a template or describe your goal to get started.",
      loadingVisuals: "Gemini is sketching your visuals...",
      apiKeyBtn: "Connect API Key",
      statusReady: "AI Core Ready",
      init: "Initializing EmailGenius AI...",
      billingMsg: "Billing Setup required.",
      sendBtn: "Send Campaign",
      sendWhatsAppBtn: "Send via WhatsApp",
      sendModalTitle: "Send to Recipients",
      whatsappLabel: "WhatsApp Number",
      whatsappPlaceholder: "e.g. 15551234567",
      whatsappShareMsg: "Share via WhatsApp",
      recipientsLabel: "Recipient Emails",
      recipientsPlaceholder: "email1@example.com...",
      confirmSend: "Confirm Send",
      sendingMsg: "Sending... {current} of {total}",
      sendSuccess: "Campaign sent successfully!",
      cancel: "Cancel",
      historyItemDate: "Generated on",
      language: "Language",
      ctaSettings: "Button Settings",
      ctaLabelText: "Button Text",
      ctaLabelUrl: "Target Link (URL)",
      performanceMetrics: "Performance Metrics",
      openRate: "Open Rate",
      ctr: "CTR",
      sent: "Sent",
      delivered: "Delivered",
      pendingStats: "Statistics pending send",
      scheduleLabel: "Schedule Delivery",
      scheduleDate: "Date",
      scheduleTime: "Time",
      scheduleBtn: "Schedule Campaign",
      scheduledMsg: "Campaign scheduled for {date}",
      statusScheduled: "Scheduled"
    }
  }[lang];

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } catch (e) {
      setHasApiKey(true);
    } finally {
      setIsApiKeyChecking(false);
    }
  };

  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    } catch (e) {
      console.error("Failed to open key selector");
    }
  };

  const handleApplyTemplate = (template: Template) => {
    setSelectedTemplate(template.id);
    setPrompt(template.basePrompt[lang]);
    setActiveSidebarTab('create');
  };

  const updateCTA = (field: 'ctaText' | 'ctaUrl', value: string) => {
    if (!currentCampaign) return;
    const updated = {
      ...currentCampaign,
      content: {
        ...currentCampaign.content,
        [field]: value
      }
    };
    setCurrentCampaign(updated);
    setHistory(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const content = await generateEmailCampaign(prompt, lang, selectedTemplate || undefined);
      const selectedStyleValue = quickStyles.find(s => s.id === selectedStyleTag)?.value || '';
      const finalStyleInstructions = `${selectedStyleValue} ${styleInstructions}`.trim();
      const imageUrl = await generateCampaignImage(content.visualPrompt, imageSize, finalStyleInstructions);
      
      const newCampaign: Campaign = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        content,
        imageUrl,
        language: lang,
        templateId: selectedTemplate || undefined
      };

      setCurrentCampaign(newCampaign);
      setHistory(prev => [newCampaign, ...prev]);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError(lang === 'pt' ? "Chave API inválida." : "Invalid API Key.");
      } else {
        setError(err.message || "Error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!currentCampaign) return;
    const emailList = recipients.split(',').map(e => e.trim()).filter(e => e.includes('@'));
    if (emailList.length === 0) return;
    
    if (scheduledDate && scheduledTime) {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
      const updatedCampaign = { ...currentCampaign, scheduledAt };
      
      setCurrentCampaign(updatedCampaign);
      setHistory(prev => prev.map(item => item.id === updatedCampaign.id ? updatedCampaign : item));
      
      setShowSendModal(false);
      setRecipients('');
      setScheduledDate('');
      setScheduledTime('');
      alert(t.scheduledMsg.replace('{date}', formatDate(scheduledAt)));
      return;
    }

    setIsSending(true);
    setSendProgress({ current: 0, total: emailList.length });
    
    for (let i = 1; i <= emailList.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSendProgress({ current: i, total: emailList.length });
    }

    // Generate simulated metrics
    const simulatedMetrics: CampaignMetrics = {
      totalSent: emailList.length,
      delivered: Math.floor(emailList.length * (0.95 + Math.random() * 0.05)),
      openRate: 15 + Math.floor(Math.random() * 30), // 15% - 45%
      clickThroughRate: 1 + Math.floor(Math.random() * 9), // 1% - 10%
    };

    const updatedCampaign = { ...currentCampaign, metrics: simulatedMetrics, scheduledAt: undefined };
    
    setTimeout(() => {
      setIsSending(false);
      setSendProgress(null);
      setShowSendModal(false);
      setRecipients('');
      setCurrentCampaign(updatedCampaign);
      setHistory(prev => prev.map(item => item.id === updatedCampaign.id ? updatedCampaign : item));
      alert(t.sendSuccess);
    }, 500);
  };

  const handleWhatsAppShare = () => {
    if (!currentCampaign) return;
    
    const { subject, headline, body, ctaText, ctaUrl } = currentCampaign.content;
    const text = `*${subject}*\n\n${headline}\n\n${body}\n\n*${ctaText}:* ${ctaUrl}`;
    const encodedText = encodeURIComponent(text);
    
    const url = whatsappNumber 
      ? `https://api.whatsapp.com/send?phone=${whatsappNumber.replace(/\D/g, '')}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    
    window.open(url, '_blank');
    setShowSendModal(false);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (isApiKeyChecking) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-slate-600">{t.init}</div></div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">E</div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{t.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
              <button onClick={() => setLang('pt')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${lang === 'pt' ? 'bg-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}>🇧🇷</button>
              <button onClick={() => setLang('en')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${lang === 'en' ? 'bg-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}>🇺🇸</button>
            </div>
            {!hasApiKey && <Button onClick={handleOpenKeySelector} variant="outline" className="text-sm">{t.apiKeyBtn}</Button>}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            <button 
              onClick={() => setActiveSidebarTab('create')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeSidebarTab === 'create' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              {t.architect}
            </button>
            <button 
              onClick={() => setActiveSidebarTab('history')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeSidebarTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {t.history}
              {history.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeSidebarTab === 'history' ? 'bg-indigo-400 text-white' : 'bg-slate-200 text-slate-600'}`}>{history.length}</span>}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeSidebarTab === 'create' ? (
              <motion.div 
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t.templatesLabel}</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map(tmp => (
                      <motion.button
                        key={tmp.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApplyTemplate(tmp)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedTemplate === tmp.id ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xl mb-1">{tmp.icon}</div>
                        <div className="text-[11px] font-bold text-slate-800">{tmp.name[lang]}</div>
                        <div className="text-[9px] text-slate-500 line-clamp-1">{tmp.description[lang]}</div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    {t.architect}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t.goalLabel}</label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t.goalPlaceholder}
                        className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">{t.styleLabel}</label>
                      <input type="text" value={styleInstructions} onChange={(e) => setStyleInstructions(e.target.value)} placeholder={t.stylePlaceholder} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" />
                      <div className="flex flex-wrap gap-1.5">
                        {quickStyles.map(s => (
                          <motion.button 
                            key={s.id} 
                            type="button" 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedStyleTag(selectedStyleTag === s.id ? null : s.id)} 
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${selectedStyleTag === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                          >
                            {s.label[lang]}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t.qualityLabel}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {qualityTiers.map((tier) => (
                          <motion.button
                            key={tier.id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setImageSize(tier.id as ImageSize)}
                            className={`py-2.5 px-1 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-0.5 ${
                              imageSize === tier.id 
                                ? tier.activeClass 
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50/50'
                            }`}
                          >
                            <span>{tier.label[lang]}</span>
                            <span className={`text-[8px] opacity-70 font-medium ${imageSize === tier.id ? 'text-white' : 'text-slate-400'}`}>
                              {tier.res} • {tier.sub[lang]}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full py-3.5 shadow-lg shadow-indigo-100" isLoading={isLoading} disabled={!prompt.trim() || !hasApiKey}>{t.generateBtn}</Button>
                    {error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 text-red-600 text-[10px] rounded-xl border border-red-100">{error}</motion.div>}
                  </form>
                </section>
              </motion.div>
            ) : (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[600px] overflow-hidden flex flex-col"
              >
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                  {t.history}
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-400 font-normal">{history.length} items</span>
                </h2>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <p className="text-xs text-slate-400 italic">{t.noCampaigns}</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {history.map(item => (
                        <motion.button 
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ x: 4 }}
                          onClick={() => setCurrentCampaign(item)}
                          className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden ${
                            currentCampaign?.id === item.id 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                            : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="relative">
                              {item.imageUrl && <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="" />}
                              {item.metrics && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-white">
                                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate mb-1">{item.content.subject}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-100 text-slate-500 flex items-center gap-1">
                                  {item.language === 'pt' ? '🇧🇷' : '🇺🇸'} {item.language.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {formatDate(item.timestamp)}
                                </span>
                                {item.scheduledAt && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-600 font-bold uppercase">
                                    {t.statusScheduled}
                                  </span>
                                )}
                              </div>
                              {item.metrics && (
                                <div className="mt-2 flex gap-3 text-[9px] font-bold text-slate-500">
                                  <span className="text-emerald-600">{t.openRate}: {item.metrics.openRate}%</span>
                                  <span className="text-indigo-600">{t.ctr}: {item.metrics.clickThroughRate}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {currentCampaign?.id === item.id && (
                            <motion.div 
                              layoutId="active-indicator"
                              className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                            />
                          )}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-8">
          {currentCampaign ? (
            <motion.div 
              key={currentCampaign.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white mx-4 rounded-md h-7 border border-slate-200 flex items-center px-3 text-[10px] text-slate-400 truncate">{currentCampaign.content.subject}</div>
                <div className="flex gap-2">
                  <button onClick={() => setShowSendModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>{t.sendBtn}
                  </button>
                </div>
              </div>

              {/* Performance Stats Banner */}
              {currentCampaign.metrics && (
                <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="max-w-2xl mx-auto flex items-center justify-between text-indigo-900">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider">{t.performanceMetrics}</span>
                    </div>
                    <div className="flex gap-8">
                      <div className="text-center">
                        <div className="text-xl font-black text-indigo-600 leading-none">{currentCampaign.metrics.openRate}%</div>
                        <div className="text-[9px] font-bold uppercase text-indigo-400 mt-1">{t.openRate}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-black text-indigo-600 leading-none">{currentCampaign.metrics.clickThroughRate}%</div>
                        <div className="text-[9px] font-bold uppercase text-indigo-400 mt-1">{t.ctr}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-black text-indigo-600 leading-none">{currentCampaign.metrics.delivered}</div>
                        <div className="text-[9px] font-bold uppercase text-indigo-400 mt-1">{t.delivered}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-8 md:p-12 space-y-8 max-w-2xl mx-auto">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">{currentCampaign.templateId?.toUpperCase() || 'CUSTOM'}</p>
                    <span className="text-[10px] text-slate-300">•</span>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">{formatDate(currentCampaign.timestamp)}</p>
                    {currentCampaign.scheduledAt && (
                      <>
                        <span className="text-[10px] text-slate-300">•</span>
                        <p className="text-[9px] text-amber-600 font-bold uppercase flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {t.statusScheduled}: {formatDate(currentCampaign.scheduledAt)}
                        </p>
                      </>
                    )}
                    {!currentCampaign.metrics && !currentCampaign.scheduledAt && (
                      <>
                        <span className="text-[10px] text-slate-300">•</span>
                        <p className="text-[9px] text-amber-500 font-bold uppercase italic">{t.pendingStats}</p>
                      </>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight">{currentCampaign.content.subject}</h3>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video bg-slate-100 group relative">
                  <img src={currentCampaign.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl font-extrabold text-indigo-950 leading-tight">{currentCampaign.content.headline}</h2>
                  <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">{currentCampaign.content.body}</p>
                  
                  {/* Direct CTA Editor */}
                  <div className="pt-12 border-t border-slate-100 space-y-8">
                    <div className="flex flex-col items-center gap-6">
                      <motion.div 
                        layout
                        className="relative group"
                      >
                        <a 
                          href={currentCampaign.content.ctaUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 rounded-xl shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95 text-center min-w-[220px]"
                        >
                          {currentCampaign.content.ctaText}
                        </a>
                        <div className="absolute -top-3 -right-3 bg-white shadow-md rounded-full p-1.5 border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-lg bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4"
                      >
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          {t.ctaSettings}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight">{t.ctaLabelText}</label>
                            <input 
                              type="text" 
                              value={currentCampaign.content.ctaText}
                              onChange={(e) => updateCTA('ctaText', e.target.value)}
                              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight">{t.ctaLabelUrl}</label>
                            <input 
                              type="text" 
                              value={currentCampaign.content.ctaUrl}
                              onChange={(e) => updateCTA('ctaUrl', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all font-medium"
                            />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl">
              <AnimatePresence>
                {isLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative w-20 h-20">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-indigo-600">{t.loadingVisuals}</p>
                      <div className="flex justify-center gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">{t.emptyStateTitle}</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">{t.emptyStateDesc}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showSendModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-lg font-bold text-slate-800">{t.sendModalTitle}</h3><button onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Email
                </div>
                <textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder={t.recipientsPlaceholder} disabled={isSending} className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none transition-all" />
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {t.scheduleLabel}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">{t.scheduleDate}</label>
                      <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">{t.scheduleTime}</label>
                      <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100" onClick={handleSendCampaign} isLoading={isSending} disabled={!recipients.trim()}>
                  {scheduledDate && scheduledTime ? t.scheduleBtn : t.confirmSend}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-slate-300">OU</span></div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </div>
                <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder={t.whatsappPlaceholder} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" />
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100" onClick={handleWhatsAppShare}>{t.whatsappShareMsg}</Button>
              </div>

              {isSending && sendProgress && (
                <div className="space-y-2 pt-4 border-t border-slate-50"><div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>{t.sendingMsg.replace('{current}', sendProgress.current.toString()).replace('{total}', sendProgress.total.toString())}</span><span>{Math.round((sendProgress.current / sendProgress.total) * 100)}%</span></div><div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(sendProgress.current/sendProgress.total)*100}%` }} /></div></div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      <ChatWidget lang={lang} />
    </div>
  );
};

export default App;
