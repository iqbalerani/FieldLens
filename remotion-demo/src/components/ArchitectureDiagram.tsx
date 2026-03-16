import React from "react";
import { interpolate } from "remotion";
import { COLORS } from "../constants";

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  layer: "mobile" | "backend" | "web" | "nova" | "infra";
};

type Edge = {
  from: string;
  to: string;
  happy?: boolean;
};

const NODES: Node[] = [
  // Mobile layer
  { id: "mobile_app", label: "Mobile App", x: 175, y: 106, layer: "mobile" },
  { id: "camera", label: "Camera", x: 85, y: 226, layer: "mobile" },
  { id: "voice", label: "Voice", x: 175, y: 226, layer: "mobile" },
  { id: "text", label: "Text Input", x: 265, y: 226, layer: "mobile" },
  { id: "offline", label: "Offline", x: 85, y: 336, layer: "mobile" },
  { id: "auth_mobile", label: "Auth", x: 265, y: 336, layer: "mobile" },
  // Backend layer
  { id: "api", label: "API Gateway", x: 575, y: 106, layer: "backend" },
  { id: "ingest", label: "Ingest Svc", x: 455, y: 246, layer: "backend" },
  { id: "ai_pipeline", label: "AI Pipeline", x: 575, y: 246, layer: "backend" },
  { id: "search_svc", label: "Search Svc", x: 695, y: 246, layer: "backend" },
  { id: "ws_server", label: "WS Server", x: 455, y: 366, layer: "backend" },
  { id: "sse_server", label: "SSE Server", x: 695, y: 366, layer: "backend" },
  { id: "auth_api", label: "Auth API", x: 575, y: 366, layer: "backend" },
  // Web layer
  { id: "web_dash", label: "Web Dashboard", x: 975, y: 106, layer: "web" },
  { id: "feed", label: "Live Feed", x: 885, y: 226, layer: "web" },
  { id: "search_ui", label: "Search UI", x: 975, y: 226, layer: "web" },
  { id: "analytics", label: "Analytics", x: 1065, y: 226, layer: "web" },
  { id: "pdf", label: "PDF Export", x: 885, y: 336, layer: "web" },
  { id: "map", label: "Map View", x: 1065, y: 336, layer: "web" },
  // Nova layer
  { id: "nova_lite", label: "Nova 2 Lite", x: 425, y: 516, layer: "nova" },
  { id: "nova_sonic", label: "Nova 2 Sonic", x: 575, y: 516, layer: "nova" },
  { id: "nova_embed", label: "Nova Embed", x: 725, y: 516, layer: "nova" },
  { id: "bedrock", label: "Amazon Bedrock", x: 575, y: 616, layer: "nova" },
  // Infra layer
  { id: "s3", label: "S3", x: 85, y: 526, layer: "infra" },
  { id: "rds", label: "RDS", x: 205, y: 526, layer: "infra" },
  { id: "cognito", label: "Cognito", x: 85, y: 626, layer: "infra" },
  { id: "lambda", label: "Lambda", x: 205, y: 626, layer: "infra" },
  { id: "cloudwatch", label: "CloudWatch", x: 855, y: 526, layer: "infra" },
  { id: "cloudfront", label: "CloudFront", x: 985, y: 526, layer: "infra" },
  { id: "sns", label: "SNS", x: 855, y: 626, layer: "infra" },
];

const EDGES: Edge[] = [
  { from: "mobile_app", to: "camera" },
  { from: "mobile_app", to: "voice" },
  { from: "mobile_app", to: "text" },
  { from: "mobile_app", to: "api", happy: true },
  { from: "camera", to: "ingest" },
  { from: "voice", to: "ai_pipeline", happy: true },
  { from: "text", to: "ingest" },
  { from: "api", to: "ingest" },
  { from: "api", to: "ai_pipeline" },
  { from: "api", to: "search_svc" },
  { from: "api", to: "auth_api" },
  { from: "ingest", to: "ai_pipeline", happy: true },
  { from: "ai_pipeline", to: "nova_lite", happy: true },
  { from: "ai_pipeline", to: "nova_sonic", happy: true },
  { from: "search_svc", to: "nova_embed", happy: true },
  { from: "nova_lite", to: "bedrock" },
  { from: "nova_sonic", to: "bedrock" },
  { from: "nova_embed", to: "bedrock" },
  { from: "ws_server", to: "feed" },
  { from: "sse_server", to: "analytics" },
  { from: "api", to: "web_dash" },
  { from: "web_dash", to: "feed" },
  { from: "web_dash", to: "search_ui" },
  { from: "web_dash", to: "analytics" },
  { from: "ingest", to: "s3" },
  { from: "ai_pipeline", to: "rds" },
  { from: "auth_api", to: "cognito" },
  { from: "web_dash", to: "cloudfront" },
  { from: "ai_pipeline", to: "cloudwatch" },
];

const LAYER_COLORS: Record<string, string> = {
  mobile: COLORS.mobileBlue,
  backend: COLORS.backendGreen,
  web: COLORS.webOrange,
  nova: COLORS.awsOrange,
  infra: COLORS.infraPurple,
};

const LAYER_REVEAL_FRAMES: Record<string, number> = {
  mobile: 60,
  backend: 150,
  web: 240,
  nova: 330,
  infra: 420,
};

const EDGE_START_FRAME = 510;
const HAPPY_PATH_START = 690;
const HAPPY_PATH_END = 870;

function getNode(id: string): Node | undefined {
  return NODES.find((n) => n.id === id);
}

function nodeCenter(node: Node): { cx: number; cy: number } {
  return { cx: node.x, cy: node.y + 55 };
}

type ArchitectureDiagramProps = {
  frame: number;
};

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  frame,
}) => {
  return (
    <svg
      viewBox="0 0 1100 730"
      style={{ width: 1560, height: 920 }}
    >
      {/* Background zones */}
      {[
        { layer: "mobile", x: 30, y: 60, w: 290, h: 330, label: "Mobile" },
        { layer: "backend", x: 400, y: 60, w: 350, h: 360, label: "Backend" },
        { layer: "web", x: 820, y: 60, w: 270, h: 330, label: "Web" },
        { layer: "nova", x: 370, y: 470, w: 410, h: 195, label: "Amazon Nova" },
        { layer: "infra", x: 30, y: 470, w: 300, h: 195, label: "Infrastructure" },
        {
          layer: "infra",
          x: 800,
          y: 470,
          w: 320,
          h: 195,
          label: "AWS Services",
        },
      ].map(({ layer, x, y, w, h, label }) => {
        const revealFrame = LAYER_REVEAL_FRAMES[layer];
        const opacity = interpolate(frame, [revealFrame, revealFrame + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const color = LAYER_COLORS[layer];
        return (
          <g key={`zone-${layer}-${x}`} style={{ opacity }}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={12}
              fill={`${color}08`}
              stroke={`${color}30`}
              strokeWidth={1}
            />
            <text
              x={x + 12}
              y={y + 18}
              fill={color}
              fontSize={11}
              fontWeight={700}
              letterSpacing="0.08em"
              style={{ textTransform: "uppercase" }}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Edges */}
      {EDGES.map((edge, i) => {
        const fromNode = getNode(edge.from);
        const toNode = getNode(edge.to);
        if (!fromNode || !toNode) return null;
        const { cx: x1, cy: y1 } = nodeCenter(fromNode);
        const { cx: x2, cy: y2 } = nodeCenter(toNode);
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        const edgeFrame = EDGE_START_FRAME + i * 8;
        const progress = interpolate(frame, [edgeFrame, edgeFrame + 30], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const dashOffset = length * (1 - progress);

        const isHappy = edge.happy === true;
        const happyPulse = isHappy
          ? interpolate(
              frame,
              [HAPPY_PATH_START, HAPPY_PATH_START + 60, HAPPY_PATH_END - 60, HAPPY_PATH_END],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          : 0;

        const edgeColor = isHappy && happyPulse > 0
          ? COLORS.awsOrange
          : "rgba(255,255,255,0.18)";
        const strokeWidth = isHappy && happyPulse > 0 ? 2 : 1;

        return (
          <line
            key={`edge-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={edgeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={length}
            strokeDashoffset={dashOffset}
            opacity={isHappy && happyPulse > 0 ? happyPulse : progress}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((node) => {
        const revealFrame = LAYER_REVEAL_FRAMES[node.layer];
        const opacity = interpolate(frame, [revealFrame, revealFrame + 25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(frame, [revealFrame, revealFrame + 25], [0.7, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const { cx, cy } = nodeCenter(node);
        const color = LAYER_COLORS[node.layer];
        const nodeW = 80;
        const nodeH = 36;

        return (
          <g
            key={node.id}
            style={{ opacity, transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px` }}
          >
            <rect
              x={cx - nodeW / 2}
              y={cy - nodeH / 2}
              width={nodeW}
              height={nodeH}
              rx={8}
              fill={`${color}18`}
              stroke={`${color}60`}
              strokeWidth={1.5}
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fill={color}
              fontSize={9}
              fontWeight={600}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
