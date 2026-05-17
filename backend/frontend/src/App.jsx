import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Install deps: npm install react-markdown remark-gfm axios ──

export default function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 I'm your **SHL AI Assessment Assistant**.\n\nI can help you:\n- Find the right assessments for your hiring needs\n- Compare different test types\n- Understand which skills to evaluate\n\nTell me about the role you're hiring for and I'll recommend the best assessments.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ── Load JSON on page load ──
  useEffect(() => {
    fetch("/catalog.json")
      .then((res) => res.json())
      .then((data) => console.log("Catalog data:", data))
      .catch((err) => console.error("Error loading catalog.json", err));

    fetch("/documents.json")
      .then((res) => res.json())
      .then((data) => console.log("Document data:", data))
      .catch((err) => console.error("Error loading documents.json", err));
  }, []);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    const updatedChat = [...chat, userMessage];
    setChat(updatedChat);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/chat", {
        messages: updatedChat,
      });

      setChat([
        ...updatedChat,
        {
          role: "assistant",
          content: response.data.reply,
          recommendations: response.data.recommendations,
        },
      ]);
    } catch (error) {
      console.error(error);
      setChat([
        ...updatedChat,
        {
          role: "assistant",
          content:
            "⚠️ Sorry, I couldn't connect to the server. Please check that the backend is running and try again.",
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* ── Top bar ── */}
        <div style={styles.topbar}>
          <div style={styles.avatarRing}>
            <BrainIcon />
          </div>
          <div>
            <p style={styles.topbarTitle}>SHL AI Assessment Assistant</p>
            <p style={styles.topbarSub}>Hiring Partner</p>
          </div>
          <div style={styles.statusDot} title="Online" />
        </div>

        {/* ── Messages ── */}
        <div style={styles.msgs}>
          <p style={styles.datestamp}>Today</p>

          {chat.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.row,
                ...(msg.role === "user" ? styles.rowUser : {}),
              }}
            >
              {msg.role === "assistant" && (
                <div style={styles.botAvatar}>
                  <BrainIcon small />
                </div>
              )}

              <div
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user"
                    ? styles.bubbleUser
                    : styles.bubbleBot),
                }}
              >
                {/* Markdown content */}
                <div
                  style={msg.role === "user" ? styles.mdUser : styles.mdBot}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={mdComponents(msg.role === "user")}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Recommendation cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={styles.recs}>
                    {msg.recommendations.map((item, idx) => (
                      <RecCard key={idx} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={styles.row}>
              <div style={styles.botAvatar}>
                <BrainIcon small />
              </div>
              <div style={{ ...styles.bubble, ...styles.bubbleBot }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input bar ── */}
        <div style={styles.inputbar}>
          <div style={styles.inputWrap}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter hiring requirements…"
              style={styles.input}
            />
            {message && (
              <button
                onClick={() => setMessage("")}
                style={styles.clearBtn}
                aria-label="Clear input"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            style={{
              ...styles.sendBtn,
              opacity: loading || !message.trim() ? 0.45 : 1,
              cursor: loading || !message.trim() ? "default" : "pointer",
            }}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recommendation card ──
function RecCard({ item }) {
  const typeLabel = item.test_type?.split("/")?.[0]?.trim() ?? "Assessment";
  return (
    <div style={styles.recCard}>
      <div style={styles.recInfo}>
        <p style={styles.recName}>{item.name}</p>
        <p style={styles.recType}>{item.test_type}</p>
      </div>
      <span style={styles.recBadge}>{typeLabel}</span>
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        style={styles.recLink}
      >
        View ↗
      </a>
    </div>
  );
}

// ── Typing animation ──
function TypingDots() {
  return (
    <div style={styles.typingDots}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.2}s` }} />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Custom markdown renderers ──
function mdComponents(isUser) {
  const txt = isUser ? "#fff" : "var(--color-text-primary, #1a1a1a)";
  const mutedTxt = isUser ? "rgba(255,255,255,0.8)" : "#666";
  const codeBg = isUser ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.07)";
  const borderClr = isUser ? "rgba(255,255,255,0.3)" : "#e2e2e2";
  return {
    p: ({ children }) => (
      <p style={{ color: txt, marginBottom: 6, lineHeight: 1.6, fontSize: 14 }}>
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong style={{ color: txt, fontWeight: 600 }}>{children}</strong>
    ),
    em: ({ children }) => (
      <em style={{ color: txt, fontStyle: "italic" }}>{children}</em>
    ),
    h1: ({ children }) => (
      <h1 style={{ color: txt, fontSize: 17, fontWeight: 600, margin: "8px 0 4px" }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ color: txt, fontSize: 15, fontWeight: 600, margin: "8px 0 4px" }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ color: txt, fontSize: 14, fontWeight: 600, margin: "6px 0 3px" }}>
        {children}
      </h3>
    ),
    ul: ({ children }) => (
      <ul style={{ color: txt, paddingLeft: 18, margin: "4px 0 8px", fontSize: 14 }}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol style={{ color: txt, paddingLeft: 18, margin: "4px 0 8px", fontSize: 14 }}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li style={{ color: txt, marginBottom: 4, lineHeight: 1.55, fontSize: 14 }}>
        {children}
      </li>
    ),
    code: ({ inline, children }) =>
      inline ? (
        <code
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            background: codeBg,
            color: txt,
            padding: "2px 5px",
            borderRadius: 4,
          }}
        >
          {children}
        </code>
      ) : (
        <pre
          style={{
            background: codeBg,
            border: `1px solid ${borderClr}`,
            borderRadius: 8,
            padding: "10px 12px",
            overflowX: "auto",
            margin: "6px 0",
          }}
        >
          <code style={{ fontFamily: "monospace", fontSize: 12, color: txt }}>
            {children}
          </code>
        </pre>
      ),
    blockquote: ({ children }) => (
      <blockquote
        style={{
          borderLeft: `2px solid ${borderClr}`,
          paddingLeft: 10,
          color: mutedTxt,
          margin: "6px 0",
          fontSize: 14,
        }}
      >
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr style={{ border: "none", borderTop: `1px solid ${borderClr}`, margin: "8px 0" }} />
    ),
    table: ({ children }) => (
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          margin: "6px 0",
          color: txt,
        }}
      >
        {children}
      </table>
    ),
    th: ({ children }) => (
      <th
        style={{
          background: codeBg,
          padding: "6px 8px",
          textAlign: "left",
          fontWeight: 600,
          border: `1px solid ${borderClr}`,
          color: txt,
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{ padding: "6px 8px", border: `1px solid ${borderClr}`, color: txt }}
      >
        {children}
      </td>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ color: isUser ? "#d4c7ff" : "#7F77DD", textDecoration: "underline", fontSize: 14 }}
      >
        {children}
      </a>
    ),
  };
}

// ── Icons ──
function BrainIcon({ small }) {
  const s = small ? 13 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.955.5 2.5 2.5 0 0 0-.5 4.9A2.5 2.5 0 1 0 12 10V5z"/>
      <path d="M12 5a3 3 0 1 1 5.955.5 2.5 2.5 0 0 1 .5 4.9A2.5 2.5 0 1 1 12 10V5z"/>
      <path d="M9 12.5V15a3 3 0 0 0 6 0v-2.5"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

// ── Styles ──
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  shell: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: 720,
    height: "85vh",
    maxHeight: 780,
    background: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
  },
  topbar: {
    padding: "14px 18px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7F77DD, #378ADD)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  topbarTitle: { fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 },
  topbarSub: { fontSize: 12, color: "#888", margin: 0, marginTop: 1 },
  statusDot: {
    width: 8,
    height: 8,
    background: "#1D9E75",
    borderRadius: "50%",
    marginLeft: "auto",
    flexShrink: 0,
  },
  msgs: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#fafafa",
  },
  datestamp: { fontSize: 11, color: "#aaa", textAlign: "center", margin: "4px 0" },
  row: { display: "flex", gap: 8, alignItems: "flex-end" },
  rowUser: { flexDirection: "row-reverse" },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7F77DD, #378ADD)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "82%",
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.6,
  },
  bubbleUser: {
    background: "linear-gradient(135deg, #7F77DD, #534AB7)",
    borderBottomRightRadius: 4,
    color: "#fff",
  },
  bubbleBot: {
    background: "#fff",
    border: "1px solid #ebebeb",
    borderBottomLeftRadius: 4,
    color: "#1a1a1a",
  },
  mdUser: { color: "#fff" },
  mdBot: { color: "#1a1a1a" },
  recs: { marginTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  recCard: {
    background: "#f8f8ff",
    border: "1px solid #e8e6f8",
    borderRadius: 10,
    padding: "10px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  recInfo: { flex: 1, minWidth: 0 },
  recName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  recType: { fontSize: 11, color: "#888", margin: 0, marginTop: 2 },
  recBadge: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 20,
    background: "#EEF0FF",
    color: "#534AB7",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontWeight: 500,
  },
  recLink: {
    fontSize: 12,
    color: "#7F77DD",
    textDecoration: "none",
    flexShrink: 0,
    fontWeight: 500,
  },
  typingDots: { display: "flex", gap: 4, alignItems: "center", padding: "2px 0" },
  dot: {
    width: 6,
    height: 6,
    background: "#aaa",
    borderRadius: "50%",
    display: "inline-block",
    animation: "bounce 1.2s infinite",
  },
  inputbar: {
    padding: "12px 14px",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "#fff",
  },
  inputWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f5f5f5",
    borderRadius: 22,
    padding: "8px 14px",
    border: "1px solid #ebebeb",
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 14,
    color: "#1a1a1a",
    outline: "none",
    lineHeight: 1.4,
  },
  clearBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    color: "#aaa",
    fontSize: 13,
    lineHeight: 1,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7F77DD, #534AB7)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.15s, transform 0.1s",
  },
};