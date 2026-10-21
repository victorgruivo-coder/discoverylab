import {
  type DecisionLogContent,
  type DiscoveryOutput,
  type JtbdContent,
  type OstContent,
  type OstNode,
  type ProblemStatementContent,
} from '@discoverylab/shared';

import {
  frameworkKey as frameworkKeySchema,
  parseStoredContent,
} from '../frameworks/schemas.js';

import type { FrameworkKey, RiceScoredContent } from '../frameworks/schemas.js';

/**
 * Markdown generation only: a pure string transformation, no IO and no HTTP.
 * Any timestamp-like value comes from the discovery itself, so exporting the
 * same data twice always produces byte-identical output.
 *
 * The framework rows are accepted structurally (key + JSONB content) so this
 * module stays independent of the Prisma client and is easy to exercise with
 * fixtures. Content is re-validated with the same schemas the API writes with.
 */
export type FrameworkInstanceInput = {
  readonly frameworkKey: string;
  readonly content: unknown;
};

/** Wizard stage order, which is also the order sections appear in the export. */
const frameworkSections: readonly (readonly [FrameworkKey, string])[] = [
  ['problem-statement', 'Problem Statement'],
  ['jtbd', 'Jobs To Be Done'],
  ['ost', 'Opportunity Solution Tree'],
  ['rice', 'RICE'],
  ['decision-log', 'Decision Log'],
];

function isText(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

/** Collapses newlines so a value can live inside a list item or table cell. */
function inline(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function labelled(label: string, value: string | undefined): string | null {
  return isText(value) ? `**${label}:** ${value.trim()}` : null;
}

function renderMetadata(discovery: DiscoveryOutput): string {
  const lines = [
    `- **Lead:** ${discovery.leadName ?? '—'}`,
    `- **Type:** ${discovery.type}`,
    `- **Status:** ${discovery.status}`,
    `- **Start date:** ${discovery.startDate}`,
  ];

  if (discovery.endDate !== undefined) {
    lines.push(`- **End date:** ${discovery.endDate}`);
  }

  return lines.join('\n');
}

function renderProblemStatement(
  content: ProblemStatementContent,
): string | null {
  const fields = [
    labelled('Problem', content.problem),
    labelled('Who is affected', content.whoIsAffected),
    labelled('Why now', content.whyNow),
    labelled('Constraints', content.constraints),
    labelled('Success criteria', content.successCriteria),
  ].filter((field): field is string => field !== null);

  return fields.length === 0 ? null : fields.join('\n\n');
}

function renderJtbd(content: JtbdContent): string | null {
  if (content.length === 0) {
    return null;
  }

  const lines = content.flatMap((entry) => {
    const item = [`- ${inline(entry.jobStatement)}`];

    if (isText(entry.segment)) {
      item.push(`  - **Segment:** ${inline(entry.segment)}`);
    }

    if (isText(entry.notes)) {
      item.push(`  - **Notes:** ${inline(entry.notes)}`);
    }

    return item;
  });

  return lines.join('\n');
}

/**
 * Renders the tree depth-first in stored node order. A node whose parent is
 * missing is promoted to a root instead of disappearing; a cycle has no root,
 * so the leftover pass emits each remaining node once and the visited set
 * stops the recursion.
 */
function renderOst(content: OstContent): string | null {
  const { nodes } = content;

  if (nodes.length === 0) {
    return null;
  }

  const ids = new Set(
    nodes.flatMap((node) => (node.id === undefined ? [] : [node.id])),
  );
  const childrenByParent = new Map<string, OstNode[]>();

  for (const node of nodes) {
    if (node.parentId === undefined || node.parentId === null) {
      continue;
    }

    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const visited = new Set<OstNode>();
  const lines: string[] = [];

  const renderNode = (node: OstNode, depth: number): void => {
    if (visited.has(node)) {
      return;
    }

    visited.add(node);

    const notes = isText(node.notes) ? ` — ${inline(node.notes)}` : '';
    lines.push(`${'  '.repeat(depth)}- ${inline(node.title)}${notes}`);

    const children =
      node.id === undefined ? [] : (childrenByParent.get(node.id) ?? []);

    for (const child of children) {
      renderNode(child, depth + 1);
    }
  };

  const roots = nodes.filter(
    (node) =>
      node.parentId === undefined ||
      node.parentId === null ||
      !ids.has(node.parentId),
  );

  for (const root of roots) {
    renderNode(root, 0);
  }

  for (const node of nodes) {
    renderNode(node, 0);
  }

  return lines.join('\n');
}

/** A pipe or newline would break the row apart, so both are neutralized. */
function escapeTableCell(value: string): string {
  return inline(value).replace(/\|/g, '\\|');
}

function renderRice(content: RiceScoredContent): string | null {
  if (content.length === 0) {
    return null;
  }

  const lines = [
    '| Opportunity | Reach | Impact | Confidence | Effort | Score |',
    '| --- | --- | --- | --- | --- | --- |',
    ...content.map(
      (entry) =>
        `| ${escapeTableCell(entry.opportunityName)} | ${entry.reach} | ${entry.impact} | ${entry.confidence} | ${entry.effort} | ${entry.score} |`,
    ),
  ];

  return lines.join('\n');
}

function renderDecisionLog(content: DecisionLogContent): string | null {
  if (content.length === 0) {
    return null;
  }

  const lines = content.flatMap((entry) => {
    const item = [`- **${inline(entry.decision)}**`];

    if (isText(entry.rationale)) {
      item.push(`  - **Rationale:** ${inline(entry.rationale)}`);
    }

    if (isText(entry.owner)) {
      item.push(`  - **Owner:** ${inline(entry.owner)}`);
    }

    if (isText(entry.decidedAt)) {
      item.push(`  - **Decided:** ${entry.decidedAt}`);
    }

    return item;
  });

  return lines.join('\n');
}

/** Null means "nothing worth exporting", so the whole section is omitted. */
function renderSection(key: FrameworkKey, content: unknown): string | null {
  switch (key) {
    case 'problem-statement':
      return renderProblemStatement(parseStoredContent(key, content));
    case 'jtbd':
      return renderJtbd(parseStoredContent(key, content));
    case 'ost':
      return renderOst(parseStoredContent(key, content));
    case 'rice':
      return renderRice(parseStoredContent(key, content));
    case 'decision-log':
      return renderDecisionLog(parseStoredContent(key, content));
  }
}

export function formatDiscoveryMarkdown(
  discovery: DiscoveryOutput,
  frameworks: readonly FrameworkInstanceInput[],
): string {
  const contentByKey = new Map<FrameworkKey, unknown>();

  for (const framework of frameworks) {
    contentByKey.set(
      frameworkKeySchema.parse(framework.frameworkKey),
      framework.content,
    );
  }

  const sections = [`# ${inline(discovery.name)}`, renderMetadata(discovery)];

  for (const [key, title] of frameworkSections) {
    const content = contentByKey.get(key);

    if (content === undefined) {
      continue;
    }

    const body = renderSection(key, content);

    if (body !== null) {
      sections.push(`## ${title}\n\n${body}`);
    }
  }

  return `${sections.join('\n\n')}\n`;
}
