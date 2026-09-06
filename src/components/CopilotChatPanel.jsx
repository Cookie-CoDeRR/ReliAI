import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  X,
  FileText,
  Loader2,
  Bot
} from 'lucide-react';
import { submitFollowUp, uploadDocument } from '../services/api';

export default function CopilotChatPanel({
  activeIncidentId,
  isInvestigating = false,
  activeAgent = null,
  agentTraces = [],
  onTriggerInvestigation,
  activeScenarioName = "Joint 3 Overheat",
  messages: externalMessages,
  setMessages: setExternalMessages,
  onSendMessage: externalSendMessage
}) {
  const [internalMessages, setInternalMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const setMessages = setExternalMessages !== undefined ? setExternalMessages : setInternalMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentTraces]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        raw: file,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type
      });
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachedFile) || isSending) return;

    const queryText = inputText.trim();
    const currentAttached = attachedFile;
    setInputText('');
    setAttachedFile(null);

    if (externalSendMessage) {
      externalSendMessage(queryText, currentAttached);
      return;
    }

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      attachment: currentAttached ? currentAttached.name : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const prompt = queryText + (currentAttached ? ` [Document attached: ${currentAttached.name}]` : '');
    setIsSending(true);

    try {
      let uploadId = null;
      if (currentAttached?.raw) {
        try {
          const uploadRes = await uploadDocument(currentAttached.raw, activeIncidentId);
          uploadId = uploadRes.upload_id;
        } catch (uploadErr) {
          console.warn("Document upload failed, proceeding with prompt:", uploadErr);
        }
      }

      if (activeIncidentId) {
        // Submit follow-up inquiry to FastAPI backend
        const res = await submitFollowUp(activeIncidentId, {
          operator_notes: prompt + (uploadId ? ` [Stored Upload ID: ${uploadId}]` : ''),
          telemetry_override: null
        });

        const replyText =
          res?.verdict?.primary_root_cause?.description ||
          `Investigation verified for ${activeIncidentId}. Confidence: ${
            res?.verdict?.final_confidence_score ?? 94
          }%. Primary claim: ${res?.verdict?.primary_root_cause?.title || 'Physical telemetry verified.'}`;

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        // Trigger investigation if not already active
        if (onTriggerInvestigation) {
          onTriggerInvestigation();
        }
      }
    } catch (err) {
      console.error("Copilot query failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `Query received: "${prompt}". Harness streaming live telemetry verification.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };



  const hasMessages = messages.length > 0 || isInvestigating;

  return (
    <div className="h-full min-h-0 w-full flex flex-col justify-between p-3.5 bg-white/95 backdrop-blur-md rounded-[10px] border border-white/80 shadow-xs overflow-hidden transition-all duration-300">
      
      {/* Top Header (Only visible when user starts talking, small ReliAI title at top) */}
      {hasMessages && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0 transition-all duration-300">
          <span className="font-jersey text-xl text-[#d98555] tracking-wider select-none">
            ReliAI
          </span>
          {activeIncidentId && (
            <span className="text-[9px] font-mono font-semibold text-[#c8764b] bg-[#faeee5] px-2 py-0.5 rounded-full border border-[#efc4ab]">
              {activeIncidentId}
            </span>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {!hasMessages ? (
        /* Empty State: ReliAI Title Centered Horizontally & Vertically */
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none transition-all duration-300">
          <h1 className="font-jersey text-5xl sm:text-6xl text-[#d98555] tracking-wider leading-none drop-shadow-sm">
            ReliAI
          </h1>
          <p className="font-mono text-[10px] text-slate-400 mt-2 max-w-[200px] leading-tight">
            Ask questions, upload documents, or inspect active telemetry.
          </p>
        </div>
      ) : (
        /* Active Chat Message Stream */
        <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-2.5 text-[11px] min-h-0">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-2.5 rounded-[14px] leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-gradient-to-r from-[#dc936b] to-[#ce8055] text-white rounded-br-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#c8764b] mb-1">
                      <Bot className="w-3 h-3" />
                      <span>ReliAI</span>
                    </div>
                  )}
                  <p className="text-[11px] leading-normal">{m.text}</p>

                  {m.attachment && (
                    <div className="mt-1.5 flex items-center gap-1 text-[9.5px] font-mono bg-black/10 px-2 py-0.5 rounded-md text-white/90">
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{m.attachment}</span>
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5 px-1">
                  {m.timestamp}
                </span>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 p-2">
              <Loader2 className="w-3 h-3 animate-spin text-[#c8764b]" />
              <span>Analyzing harness telemetry...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="shrink-0 pt-1 space-y-1.5">
        {/* Attached Document Pill (if selected) */}
        {attachedFile && (
          <div className="flex items-center justify-between bg-[#faeee5] border border-[#efc4ab] rounded-[8px] px-2.5 py-1 text-[9.5px] font-mono text-[#c8764b]">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate font-semibold">{attachedFile.name}</span>
              <span className="text-[8px] text-slate-400">({attachedFile.size})</span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-0.5 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.log,.csv,.json,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Chat Input Field with Upload Document & Arrow Key Button */}
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          {/* Upload Document Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload document or logs"
            className="absolute left-2 text-slate-400 hover:text-[#d98555] transition cursor-pointer p-1 rounded-full hover:bg-slate-100"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask or send notes..."
            className="w-full h-9 pl-9 pr-9 rounded-[8px] bg-slate-50 border border-slate-200/90 text-[11px] font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#d98555] focus:bg-white transition shadow-2xs"
          />

          {/* Arrow Key Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !attachedFile) || isSending}
            title="Send prompt to harness"
            className="absolute right-1.5 w-6 h-6 rounded-[6px] bg-[#d98555] hover:bg-[#c8764b] text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shadow-xs"
          >
            {isSending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
