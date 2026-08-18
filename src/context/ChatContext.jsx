import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ChatContext = createContext(null);
const STORAGE_KEY = "gemini-clone-chats-v1";

function makeChat() {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function ChatProvider({ children }) {
  const [chats, setChats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) && saved.length ? saved : [makeChat()];
    } catch {
      return [makeChat()];
    }
  });
  const [activeId, setActiveId] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved?.[0]?.id || null;
    } catch {
      return null;
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (!activeId && chats[0]) setActiveId(chats[0].id);
  }, [activeId, chats]);

  const activeChat = chats.find((c) => c.id === activeId) || chats[0];

  function newChat() {
    const chat = makeChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
  }

  function deleteChat(id) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (!next.length) {
        const fresh = makeChat();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  function updateChat(id, patch) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, ...patch, updatedAt: Date.now() } : chat
      )
    );
  }

  async function sendMessage(content) {
    if (!content.trim() || !activeChat || isGenerating) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim()
    };

    const assistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      streaming: true
    };

    const nextMessages = [...activeChat.messages, userMessage];

    updateChat(activeChat.id, {
      title:
        activeChat.messages.length === 0
          ? content.trim().slice(0, 42)
          : activeChat.title,
      messages: [...nextMessages, assistantMessage]
    });

    setIsGenerating(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      if (!response.ok || !response.body) {
        throw new Error("API request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat.id
              ? {
                  ...chat,
                  messages: chat.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: answer }
                      : m
                  ),
                  updatedAt: Date.now()
                }
              : chat
          )
        );
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: chat.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: answer || "No response.", streaming: false }
                    : m
                )
              }
            : chat
        )
      );
    } catch (error) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: chat.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? {
                        ...m,
                        content:
                          "I couldn't connect to Gemini. Check the API server and GEMINI_API_KEY.",
                        streaming: false,
                        error: true
                      }
                    : m
                )
              }
            : chat
        )
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const value = useMemo(
    () => ({
      chats: [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
      activeChat,
      activeId,
      isGenerating,
      setActiveId,
      newChat,
      deleteChat,
      sendMessage
    }),
    [chats, activeChat, activeId, isGenerating]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
}