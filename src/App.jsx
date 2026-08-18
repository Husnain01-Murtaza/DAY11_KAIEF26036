import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Plus,
  Search,
  MessageSquare,
  Settings,
  HelpCircle,
  Send,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Copy,
  Check
} from "lucide-react";
import { useChat } from "./context/ChatContext";

function TypingDots() {
  return (
    <span className="typing-dots" aria-label="Gemini is typing">
      <i /><i /><i />
    </span>
  );
}

function Message({ message }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (message.role === "user") {
    return (
      <div className="message user-message">
        <div className="user-bubble">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="message assistant-message">
      <div className="gemini-avatar"><Sparkles size={18} /></div>
      <div className="assistant-body">
        {message.content ? (
          <div className="message-text">{message.content}</div>
        ) : (
          <TypingDots />
        )}
        {message.content && !message.streaming && (
          <div className="message-actions">
            <button onClick={copy} title="Copy response">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ open, onClose }) {
  const { chats, activeId, setActiveId, newChat, deleteChat } = useChat();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <button className="icon-button mobile-close" onClick={onClose}>×</button>
        <div className="brand">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>Gemini</span>
        </div>
        <button className="new-chat" onClick={newChat}>
          <Plus size={19} />
          <span>New chat</span>
        </button>
        <div className="search-box">
          <Search size={17} />
          <input placeholder="Search chats" />
        </div>
      </div>

      <div className="history-label">Recent</div>
      <div className="chat-history">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`history-item ${chat.id === activeId ? "active" : ""}`}
            onClick={() => {
              setActiveId(chat.id);
              onClose();
            }}
          >
            <MessageSquare size={16} />
            <span>{chat.title}</span>
            <button
              className="delete-chat"
              title="Delete chat"
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button><HelpCircle size={18} /> Help</button>
        <button><Settings size={18} /> Settings</button>
        <div className="account">
          <div className="account-avatar">H</div>
          <div>
            <strong>My account</strong>
            <small>Gemini clone</small>
          </div>
          <MoreHorizontal size={18} />
        </div>
      </div>
    </aside>
  );
}

function Composer() {
  const { sendMessage, isGenerating } = useChat();
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  function submit() {
    if (!value.trim() || isGenerating) return;
    sendMessage(value);
    setValue("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Gemini"
          rows={1}
          disabled={isGenerating}
        />
        <button
          className={`send-button ${value.trim() ? "ready" : ""}`}
          onClick={submit}
          disabled={!value.trim() || isGenerating}
          title="Send"
        >
          <Send size={19} />
        </button>
      </div>
      <div className="disclaimer">
        Gemini can make mistakes, so double-check it.
      </div>
    </div>
  );
}

function EmptyState() {
  const { sendMessage } = useChat();
  const suggestions = [
    "Explain quantum computing simply",
    "Build me a React study plan",
    "Give me 5 creative project ideas",
    "Help me debug my JavaScript"
  ];

  return (
    <div className="empty-state">
      <div className="hero-icon"><Sparkles size={34} /></div>
      <h1>Hello, there</h1>
      <p>How can I help you today?</p>
      <div className="suggestions">
        {suggestions.map((text) => (
          <button key={text} onClick={() => sendMessage(text)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { activeChat } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [activeChat?.messages]);

  const messages = activeChat?.messages || [];

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="main">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <div className="mobile-title">Gemini</div>
          <div className="model-pill">Gemini 3.6 Flash</div>
        </header>

        <section className="conversation" ref={messagesRef}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="messages">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </div>
          )}
        </section>

        <Composer />
      </main>
    </div>
  );
}