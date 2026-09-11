import type { ProjectFlow as FlowData, FlowNode } from "../content/project-flows";
import styles from "./ProjectFlow.module.css";

const NODE_W = 178;
const NODE_H = 52;
const COL_GAP = 56;
const ROW_GAP = 36;
const PAD = 4;

const left = (n: FlowNode) => PAD + n.col * (NODE_W + COL_GAP);
const top = (n: FlowNode) => PAD + n.row * (NODE_H + ROW_GAP);
const cx = (n: FlowNode) => left(n) + NODE_W / 2;
const cy = (n: FlowNode) => top(n) + NODE_H / 2;

/** 正交走线：同列走竖线，同行走横线，其余先横后竖拐一个直角。 */
function edgePath(a: FlowNode, b: FlowNode): string {
  if (a.col === b.col) {
    const x = cx(a);
    return a.row < b.row
      ? `M ${x} ${top(a) + NODE_H} L ${x} ${top(b)}`
      : `M ${x} ${top(a)} L ${x} ${top(b) + NODE_H}`;
  }
  if (a.row === b.row) {
    const y = cy(a);
    return a.col < b.col
      ? `M ${left(a) + NODE_W} ${y} L ${left(b)} ${y}`
      : `M ${left(a)} ${y} L ${left(b) + NODE_W} ${y}`;
  }
  // 跨行跨列：先出底（或顶），在行间空档里横过去，再竖直进目标，
  // 免得横线从别的节点身上压过去。
  const down = a.row < b.row;
  const exitY = down ? top(a) + NODE_H : top(a);
  const midY = down ? top(b) - ROW_GAP / 2 : top(b) + NODE_H + ROW_GAP / 2;
  const enterY = down ? top(b) : top(b) + NODE_H;
  return `M ${cx(a)} ${exitY} L ${cx(a)} ${midY} L ${cx(b)} ${midY} L ${cx(b)} ${enterY}`;
}

function edgeMid(a: FlowNode, b: FlowNode) {
  if (a.col === b.col) return { x: cx(a) + 8, y: (cy(a) + cy(b)) / 2, anchor: "start" as const };
  if (a.row === b.row) return { x: (cx(a) + cx(b)) / 2, y: cy(a) - 9, anchor: "middle" as const };
  const down = a.row < b.row;
  const midY = down ? top(b) - ROW_GAP / 2 : top(b) + NODE_H + ROW_GAP / 2;
  return { x: (cx(a) + cx(b)) / 2, y: midY - 6, anchor: "middle" as const };
}

export function ProjectFlow({ flow, id }: { flow: FlowData; id: string }) {
  const byId = new Map(flow.nodes.map((node) => [node.id, node]));
  const cols = Math.max(...flow.nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...flow.nodes.map((n) => n.row)) + 1;
  const width = PAD * 2 + cols * NODE_W + (cols - 1) * COL_GAP;
  const height = PAD * 2 + rows * NODE_H + (rows - 1) * ROW_GAP;
  const titleId = `flow-${id}-title`;
  const descId = `flow-${id}-desc`;

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.canvas}
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: width }}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>{flow.caption}</title>
        <desc id={descId}>{flow.summary}</desc>
        <defs>
          <marker id={`arrow-${id}`} viewBox="0 0 8 8" refX="7" refY="4"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" className={styles.arrowHead} />
          </marker>
          <marker id={`arrow-branch-${id}`} viewBox="0 0 8 8" refX="7" refY="4"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" className={styles.arrowHeadBranch} />
          </marker>
        </defs>

        {flow.edges.map((edge) => {
          const a = byId.get(edge.from);
          const b = byId.get(edge.to);
          if (!a || !b) return null;
          const mid = edge.label ? edgeMid(a, b) : null;
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <path
                className={edge.kind === "branch" ? styles.edgeBranch : styles.edge}
                d={edgePath(a, b)}
                markerEnd={`url(#arrow${edge.kind === "branch" ? "-branch" : ""}-${id})`}
              />
              {mid ? (
                <text className={styles.edgeLabel} x={mid.x} y={mid.y} textAnchor={mid.anchor}>
                  {edge.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {flow.nodes.map((node) => (
          <g key={node.id} className={styles.node} data-kind={node.kind ?? "step"}>
            <rect x={left(node)} y={top(node)} width={NODE_W} height={NODE_H}
              rx={node.kind === "input" || node.kind === "output" ? NODE_H / 2 : 5} />
            {node.step ? (
              <>
                <circle className={styles.stepDot} cx={left(node)} cy={top(node) + 13} r="10" />
                <text className={styles.stepNum} x={left(node)} y={top(node) + 13}
                  textAnchor="middle" dominantBaseline="central">
                  {node.step}
                </text>
              </>
            ) : null}
            <text x={cx(node)} y={cy(node)} textAnchor="middle" dominantBaseline="central">
              {node.label.map((line, i) => (
                <tspan key={line} x={cx(node)} dy={i === 0 ? (node.label.length - 1) * -8 : 16}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        ))}
      </svg>

      {/* 图形之外的等价文本：读屏与关图场景都能读到同一条链路。 */}
      <ol className={styles.srOnly}>
        {flow.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <figcaption className={styles.caption}>{flow.caption}</figcaption>
    </figure>
  );
}
