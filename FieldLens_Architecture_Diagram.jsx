import { useState } from "react";

const nodes = {
  mobile_app: { id: "mobile_app", label: "FieldLens Mobile", sub: "React Native / Expo", layer: "mobile", x: 120, y: 80, icon: "📱", color: "#0EA5E9", bg: "#0C4A6E" },
  camera: { id: "camera", label: "Camera Capture", sub: "expo-camera", layer: "mobile", x: 30, y: 200, icon: "📷", color: "#38BDF8", bg: "#075985" },
  voice: { id: "voice", label: "Voice Recorder", sub: "expo-av + Nova Sonic", layer: "mobile", x: 120, y: 200, icon: "🎙", color: "#38BDF8", bg: "#075985" },
  text: { id: "text", label: "Text Notes", sub: "AsyncStorage", layer: "mobile", x: 210, y: 200, icon: "📝", color: "#38BDF8", bg: "#075985" },
  offline: { id: "offline", label: "Offline Sync", sub: "NetInfo + Queue", layer: "mobile", x: 30, y: 310, icon: "🔄", color: "#38BDF8", bg: "#075985" },
  auth_mobile: { id: "auth_mobile", label: "Auth (Amplify)", sub: "Cognito SDK", layer: "mobile", x: 210, y: 310, icon: "🔐", color: "#38BDF8", bg: "#075985" },
  web_dash: { id: "web_dash", label: "Web Dashboard", sub: "Next.js 14 / Vercel", layer: "web", x: 920, y: 80, icon: "🖥", color: "#F97316", bg: "#7C2D12" },
  feed: { id: "feed", label: "Inspection Feed", sub: "SSE real-time", layer: "web", x: 830, y: 200, icon: "📡", color: "#FB923C", bg: "#9A3412" },
  search_ui: { id: "search_ui", label: "Semantic Search", sub: "Natural language", layer: "web", x: 920, y: 200, icon: "🔍", color: "#FB923C", bg: "#9A3412" },
  analytics: { id: "analytics", label: "Analytics", sub: "Recharts", layer: "web", x: 1010, y: 200, icon: "📊", color: "#FB923C", bg: "#9A3412" },
  pdf: { id: "pdf", label: "PDF Export", sub: "@react-pdf", layer: "web", x: 830, y: 310, icon: "📄", color: "#FB923C", bg: "#9A3412" },
  map: { id: "map", label: "Sites Map", sub: "React Leaflet", layer: "web", x: 1010, y: 310, icon: "🗺", color: "#FB923C", bg: "#9A3412" },
  api: { id: "api", label: "FastAPI Backend", sub: "Python 3.12 / EC2", layer: "backend", x: 520, y: 80, icon: "⚙️", color: "#22C55E", bg: "#14532D" },
  ingest: { id: "ingest", label: "Ingest Service", sub: "Upload + Validate", layer: "backend", x: 400, y: 220, icon: "📥", color: "#4ADE80", bg: "#166534" },
  ai_pipeline: { id: "ai_pipeline", label: "AI Pipeline", sub: "Orchestrator", layer: "backend", x: 520, y: 220, icon: "🧠", color: "#4ADE80", bg: "#166534" },
  search_svc: { id: "search_svc", label: "Search Service", sub: "pgvector + Embeddings", layer: "backend", x: 640, y: 220, icon: "🔎", color: "#4ADE80", bg: "#166534" },
  ws_server: { id: "ws_server", label: "WebSocket Server", sub: "Nova Sonic Proxy", layer: "backend", x: 400, y: 340, icon: "🔌", color: "#4ADE80", bg: "#166534" },
  sse_server: { id: "sse_server", label: "SSE Server", sub: "Real-time Events", layer: "backend", x: 640, y: 340, icon: "📤", color: "#4ADE80", bg: "#166534" },
  auth_api: { id: "auth_api", label: "Auth Middleware", sub: "JWT / Cognito JWKS", layer: "backend", x: 520, y: 340, icon: "🛡", color: "#4ADE80", bg: "#166534" },
  nova_lite: { id: "nova_lite", label: "Nova 2 Lite", sub: "Multimodal Reasoning", layer: "nova", x: 370, y: 490, icon: "⚡", color: "#FF9900", bg: "#431407" },
  nova_sonic: { id: "nova_sonic", label: "Nova 2 Sonic", sub: "Speech-to-Speech", layer: "nova", x: 520, y: 490, icon: "🎵", color: "#FF9900", bg: "#431407" },
  nova_embed: { id: "nova_embed", label: "Nova Embeddings", sub: "Multimodal Vectors", layer: "nova", x: 670, y: 490, icon: "🧬", color: "#FF9900", bg: "#431407" },
  bedrock: { id: "bedrock", label: "Amazon Bedrock", sub: "Managed AI Gateway", layer: "nova", x: 520, y: 590, icon: "🪨", color: "#FF9900", bg: "#1C0A00" },
  s3: { id: "s3", label: "Amazon S3", sub: "Media Storage", layer: "infra", x: 30, y: 500, icon: "🗄", color: "#A78BFA", bg: "#2E1065" },
  rds: { id: "rds", label: "Amazon RDS", sub: "PostgreSQL + pgvector", layer: "infra", x: 150, y: 500, icon: "🛢", color: "#A78BFA", bg: "#2E1065" },
  cognito: { id: "cognito", label: "Amazon Cognito", sub: "Auth / JWT", layer: "infra", x: 30, y: 600, icon: "🔑", color: "#A78BFA", bg: "#2E1065" },
  lambda: { id: "lambda", label: "AWS Lambda", sub: "S3 Event Trigger", layer: "infra", x: 150, y: 600, icon: "λ", color: "#A78BFA", bg: "#2E1065" },
  cloudwatch: { id: "cloudwatch", label: "CloudWatch", sub: "Logs + Alerts", layer: "infra", x: 800, y: 500, icon: "📈", color: "#A78BFA", bg: "#2E1065" },
  cloudfront: { id: "cloudfront", label: "CloudFront", sub: "CDN / HTTPS", layer: "infra", x: 930, y: 500, icon: "🌐", color: "#A78BFA", bg: "#2E1065" },
  sns: { id: "sns", label: "Amazon SNS", sub: "Alerts / Notifications", layer: "infra", x: 800, y: 600, icon: "🔔", color: "#A78BFA", bg: "#2E1065" },
};

const edges = [
  { from: "camera", to: "ingest", label: "S3 presigned upload", color: "#38BDF8", dashed: false },
  { from: "voice", to: "ws_server", label: "WebSocket stream", color: "#38BDF8", dashed: false },
  { from: "text", to: "ingest", label: "REST API", color: "#38BDF8", dashed: false },
  { from: "mobile_app", to: "api", label: "HTTPS / JWT", color: "#0EA5E9", dashed: false },
  { from: "auth_mobile", to: "cognito", label: "OAuth2", color: "#818CF8", dashed: true },
  { from: "offline", to: "ingest", label: "Sync on connect", color: "#38BDF8", dashed: true },
  { from: "web_dash", to: "api", label: "HTTPS / JWT", color: "#F97316", dashed: false },
  { from: "feed", to: "sse_server", label: "SSE subscribe", color: "#FB923C", dashed: false },
  { from: "search_ui", to: "search_svc", label: "POST /search", color: "#FB923C", dashed: false },
  { from: "analytics", to: "api", label: "GET /analytics", color: "#FB923C", dashed: false },
  { from: "pdf", to: "api", label: "GET /reports/pdf", color: "#FB923C", dashed: true },
  { from: "map", to: "api", label: "GET /sites", color: "#FB923C", dashed: true },
  { from: "api", to: "ingest", label: "", color: "#4ADE80", dashed: false },
  { from: "api", to: "ai_pipeline", label: "", color: "#4ADE80", dashed: false },
  { from: "api", to: "search_svc", label: "", color: "#4ADE80", dashed: false },
  { from: "ingest", to: "s3", label: "Store media", color: "#A78BFA", dashed: false },
  { from: "ingest", to: "lambda", label: "Trigger preprocess", color: "#A78BFA", dashed: true },
  { from: "lambda", to: "ai_pipeline", label: "Invoke pipeline", color: "#A78BFA", dashed: true },
  { from: "ai_pipeline", to: "nova_lite", label: "Multimodal prompt", color: "#FF9900", dashed: false },
  { from: "ws_server", to: "nova_sonic", label: "Audio stream", color: "#FF9900", dashed: false },
  { from: "search_svc", to: "nova_embed", label: "Embed query", color: "#FF9900", dashed: false },
  { from: "ai_pipeline", to: "nova_embed", label: "Index report", color: "#FBBF24", dashed: true },
  { from: "ai_pipeline", to: "rds", label: "Store report", color: "#A78BFA", dashed: false },
  { from: "search_svc", to: "rds", label: "pgvector search", color: "#A78BFA", dashed: false },
  { from: "api", to: "cloudwatch", label: "Logs", color: "#A78BFA", dashed: true },
  { from: "auth_api", to: "cognito", label: "Verify JWT", color: "#818CF8", dashed: true },
  { from: "nova_lite", to: "bedrock", label: "", color: "#FF9900", dashed: false },
  { from: "nova_sonic", to: "bedrock", label: "", color: "#FF9900", dashed: false },
  { from: "nova_embed", to: "bedrock", label: "", color: "#FF9900", dashed: false },
  { from: "web_dash", to: "cloudfront", label: "CDN delivery", color: "#A78BFA", dashed: true },
  { from: "ai_pipeline", to: "sns", label: "Critical alert", color: "#A78BFA", dashed: true },
];

export default function FieldLensArchDiagram() {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const active = selected || hovered;
  const activeNode = active ? nodes[active] : null;

  const connectedIds = active
    ? new Set([active, ...edges.filter(e => e.from === active || e.to === active).flatMap(e => [e.from, e.to])])
    : null;

  const W = 1100, H = 730;

  const getNodeCenter = (id) => {
    const n = nodes[id];
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + 55, y: n.y + 26 };
  };

  const getCurvedPath = (from, to) => {
    const f = getNodeCenter(from);
    const t = getNodeCenter(to);
    const dx = t.x - f.x;
    const dy = t.y - f.y;
    const mx = (f.x + t.x) / 2;
    const my = (f.y + t.y) / 2;
    const bend = Math.abs(dx) > 200 ? 0 : Math.sign(dx) * 40;
    return `M${f.x},${f.y} Q${mx + bend},${my} ${t.x},${t.y}`;
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #060B14 0%, #0A0F1A 50%, #060D18 100%)",
      minHeight: "100vh",
      fontFamily: "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace",
      padding: "20px",
      color: "#E2E8F0",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: 7, color: "#FF9900", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
          Amazon Nova AI Hackathon 2026
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 2 }}>
          FieldLens — Full System Architecture
        </div>
        <div style={{ fontSize: 11, color: "#475569" }}>
          Hover or click any component to explore its connections
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { color: "#0EA5E9", label: "Mobile (React Native)" },
          { color: "#22C55E", label: "Backend (FastAPI)" },
          { color: "#F97316", label: "Web (Next.js)" },
          { color: "#FF9900", label: "Amazon Nova" },
          { color: "#A78BFA", label: "AWS Infrastructure" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#94A3B8" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#94A3B8" }}>
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3"/></svg>
          Async / secondary
        </div>
      </div>

      {/* SVG */}
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: "block", margin: "0 auto" }}>
          <defs>
            {["blue","green","orange","nova","purple","default"].map(id => {
              const colors = { blue:"#38BDF8", green:"#4ADE80", orange:"#FB923C", nova:"#FF9900", purple:"#A78BFA", default:"#64748B" };
              return (
                <marker key={id} id={`arr-${id}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0.5 L6,3.5 L0,6.5 Z" fill={colors[id]} opacity="0.9"/>
                </marker>
              );
            })}
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="softglow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Zone: Mobile */}
          <rect x="8" y="32" width="295" height="318" rx="14" fill="rgba(14,165,233,0.04)" stroke="#0EA5E9" strokeWidth="1" strokeDasharray="5,5" opacity="0.6"/>
          <text x="20" y="48" fontSize="8" fill="#0EA5E9" fontWeight="700" letterSpacing="3" fontFamily="monospace" opacity="0.9">MOBILE LAYER</text>

          {/* Zone: Backend */}
          <rect x="355" y="32" width="340" height="348" rx="14" fill="rgba(34,197,94,0.04)" stroke="#22C55E" strokeWidth="1" strokeDasharray="5,5" opacity="0.6"/>
          <text x="367" y="48" fontSize="8" fill="#22C55E" fontWeight="700" letterSpacing="3" fontFamily="monospace" opacity="0.9">BACKEND LAYER — FastAPI on AWS EC2</text>

          {/* Zone: Web */}
          <rect x="755" y="32" width="330" height="318" rx="14" fill="rgba(249,115,22,0.04)" stroke="#F97316" strokeWidth="1" strokeDasharray="5,5" opacity="0.6"/>
          <text x="767" y="48" fontSize="8" fill="#F97316" fontWeight="700" letterSpacing="3" fontFamily="monospace" opacity="0.9">WEB LAYER — Next.js / Vercel</text>

          {/* Zone: Nova */}
          <rect x="320" y="468" width="440" height="160" rx="14" fill="rgba(255,153,0,0.06)" stroke="#FF9900" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.8"/>
          <text x="332" y="483" fontSize="8" fill="#FF9900" fontWeight="700" letterSpacing="3" fontFamily="monospace" opacity="0.9">AMAZON NOVA — via Amazon Bedrock</text>

          {/* Zone: Infra Left */}
          <rect x="8" y="468" width="290" height="220" rx="14" fill="rgba(167,139,250,0.04)" stroke="#A78BFA" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"/>
          <text x="20" y="483" fontSize="8" fill="#A78BFA" fontWeight="700" letterSpacing="3" fontFamily="monospace" opacity="0.9">AWS INFRASTRUCTURE</text>

          {/* Zone: Infra Right */}
          <rect x="775" y="468" width="310" height="220" rx="14" fill="rgba(167,139,250,0.04)" stroke="#A78BFA" strokeWidth="1" strokeDasharray="5,5" opacity="0.5"/>
          <text x="787" y="483" fontSize="8" fill="#A78BFA" fontWeight="700" letterSpacing="3" fontFamily="monospace" opacity="0.9">AWS INFRASTRUCTURE</text>

          {/* Edges */}
          {edges.map((edge, i) => {
            const isActive = active && (edge.from === active || edge.to === active);
            const isInactive = active && !isActive;
            const opacity = isInactive ? 0.04 : isActive ? 1 : 0.22;
            const sw = isActive ? 2.2 : 1.2;

            const layer = nodes[edge.from]?.layer;
            const arrId = layer === "mobile" ? "blue" : layer === "backend" ? "green" : layer === "web" ? "orange" : layer === "nova" ? "nova" : "purple";

            return (
              <g key={i} opacity={opacity} style={{ transition: "opacity 0.25s" }}>
                <path
                  d={getCurvedPath(edge.from, edge.to)}
                  fill="none"
                  stroke={edge.color}
                  strokeWidth={sw}
                  strokeDasharray={edge.dashed ? "5,4" : "none"}
                  markerEnd={`url(#arr-${arrId})`}
                  filter={isActive ? "url(#softglow)" : "none"}
                />
                {edge.label && isActive && (() => {
                  const f = getNodeCenter(edge.from);
                  const t = getNodeCenter(edge.to);
                  const mx = (f.x + t.x) / 2;
                  const my = (f.y + t.y) / 2;
                  return (
                    <text x={mx} y={my - 7} fontSize="7.5" fill={edge.color} textAnchor="middle" fontFamily="monospace" fontWeight="700">
                      {edge.label}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Nodes */}
          {Object.values(nodes).map((node) => {
            const isActive = active === node.id;
            const isConnected = connectedIds ? connectedIds.has(node.id) : false;
            const isInactive = active && !isConnected;
            const opacity = isInactive ? 0.15 : 1;
            const scale = isActive ? 1.07 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x + 55 * (1 - scale)}, ${node.y + 26 * (1 - scale)}) scale(${scale})`}
                opacity={opacity}
                style={{ transition: "opacity 0.2s, transform 0.15s", cursor: "pointer" }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === node.id ? null : node.id)}
              >
                {/* Drop shadow */}
                <rect x="3" y="3" width="110" height="50" rx="9" fill="rgba(0,0,0,0.6)" />
                {/* Card bg */}
                <rect
                  width="110" height="50" rx="9"
                  fill={node.bg}
                  stroke={node.color}
                  strokeWidth={isActive ? 2.5 : isConnected && active ? 1.8 : 0.7}
                  filter={isActive ? "url(#glow)" : "none"}
                />
                {/* Top bar */}
                <rect width="110" height="3.5" rx="2" fill={node.color} opacity="0.9"/>
                {/* Icon */}
                <text x="9" y="30" fontSize="15" dominantBaseline="middle">{node.icon}</text>
                {/* Label */}
                <text x="29" y="19" fontSize="8.5" fill="#F1F5F9" fontWeight="700" fontFamily="monospace">{node.label}</text>
                {/* Sub */}
                <text x="29" y="31" fontSize="7" fill={node.color} opacity="0.8" fontFamily="monospace">{node.sub}</text>
              </g>
            );
          })}

          {/* Data flow path labels */}
          <g opacity={active ? 0.05 : 0.3}>
            <text x="188" y="420" fontSize="8" fill="#94A3B8" textAnchor="middle" fontFamily="monospace">↕  HTTPS + WebSocket</text>
            <text x="912" y="420" fontSize="8" fill="#94A3B8" textAnchor="middle" fontFamily="monospace">↕  HTTPS + SSE</text>
          </g>
        </svg>
      </div>

      {/* Info Panel */}
      <div style={{
        marginTop: 14,
        background: "rgba(15,23,42,0.9)",
        border: `1px solid ${activeNode ? activeNode.color + "44" : "#1E293B"}`,
        borderRadius: 12,
        padding: "14px 18px",
        maxWidth: 1100,
        margin: "14px auto 0",
        minHeight: 72,
        transition: "border-color 0.2s",
        backdropFilter: "blur(10px)",
      }}>
        {activeNode ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: activeNode.bg,
                border: `1.5px solid ${activeNode.color}`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>{activeNode.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: activeNode.color }}>{activeNode.label}</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>{activeNode.sub} · {activeNode.layer.toUpperCase()} LAYER</div>
              </div>
              <button
                onClick={() => { setSelected(null); setHovered(null); }}
                style={{
                  marginLeft: "auto", background: "transparent", border: "1px solid #334155",
                  color: "#64748B", fontSize: 10, padding: "3px 8px", borderRadius: 5, cursor: "pointer",
                  fontFamily: "monospace",
                }}>✕ clear</button>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: 3, color: "#475569", marginBottom: 5, fontWeight: 700 }}>SENDS TO</div>
                {edges.filter(e => e.from === activeNode.id).length === 0
                  ? <div style={{ fontSize: 10, color: "#334155" }}>—</div>
                  : edges.filter(e => e.from === activeNode.id).map((e, i) => (
                    <div key={i} style={{ fontSize: 10, color: "#E2E8F0", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: e.color, fontSize: 12 }}>→</span>
                      <span style={{ color: e.color, fontWeight: 600 }}>{nodes[e.to]?.label}</span>
                      {e.label && <span style={{ color: "#475569" }}>· {e.label}</span>}
                    </div>
                  ))}
              </div>
              <div>
                <div style={{ fontSize: 8, letterSpacing: 3, color: "#475569", marginBottom: 5, fontWeight: 700 }}>RECEIVES FROM</div>
                {edges.filter(e => e.to === activeNode.id).length === 0
                  ? <div style={{ fontSize: 10, color: "#334155" }}>—</div>
                  : edges.filter(e => e.to === activeNode.id).map((e, i) => (
                    <div key={i} style={{ fontSize: 10, color: "#E2E8F0", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: e.color, fontSize: 12 }}>←</span>
                      <span style={{ color: e.color, fontWeight: 600 }}>{nodes[e.from]?.label}</span>
                      {e.label && <span style={{ color: "#475569" }}>· {e.label}</span>}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, height: "100%", color: "#475569", fontSize: 11 }}>
            <span style={{ fontSize: 20 }}>👆</span>
            <div>
              Click or hover any component to see its connections ·{" "}
              <span style={{ color: "#0EA5E9" }}>5 layers</span> ·{" "}
              <span style={{ color: "#22C55E" }}>27 components</span> ·{" "}
              <span style={{ color: "#FF9900" }}>31 connections</span>
            </div>
          </div>
        )}
      </div>

      {/* Happy path strip */}
      <div style={{
        maxWidth: 1100,
        margin: "10px auto 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        fontSize: 9,
        color: "#475569",
        flexWrap: "wrap",
        letterSpacing: 0.5,
      }}>
        <span style={{ color: "#64748B", marginRight: 4 }}>HAPPY PATH:</span>
        {[
          ["📷", "Capture", "#38BDF8"],
          ["→", "", "#334155"],
          ["⚙️", "FastAPI", "#22C55E"],
          ["→", "", "#334155"],
          ["λ", "Lambda", "#A78BFA"],
          ["→", "", "#334155"],
          ["⚡", "Nova 2 Lite", "#FF9900"],
          ["→", "", "#334155"],
          ["📋", "JSON Report", "#22C55E"],
          ["→", "", "#334155"],
          ["🛢", "RDS + pgvector", "#A78BFA"],
          ["→", "", "#334155"],
          ["📡", "SSE Push", "#F97316"],
          ["→", "", "#334155"],
          ["🖥", "Dashboard", "#F97316"],
        ].map(([icon, label, color], i) => (
          <span key={i} style={{ color, fontWeight: label ? 600 : 400 }}>
            {icon}{label ? ` ${label}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
