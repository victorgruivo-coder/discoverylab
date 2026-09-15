import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

/** Prisma enum name -> shared const array name. */
const ENUM_PAIRS = {
  DiscoveryStatus: 'DISCOVERY_STATUSES',
  DiscoveryType: 'DISCOVERY_TYPES',
  OstNodeType: 'OST_NODE_TYPES',
};

function readPrismaEnums(source) {
  const enums = {};
  for (const [, name, body] of source.matchAll(
    /^enum\s+(\w+)\s*\{([^}]*)\}/gm,
  )) {
    enums[name] = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('//'));
  }
  return enums;
}

function readSharedEnums(source) {
  const enums = {};
  for (const [, name, body] of source.matchAll(
    /export const (\w+) = \[([^\]]*)\] as const/g,
  )) {
    enums[name] = body
      .split(',')
      .map((value) => value.trim().replace(/^['"]|['"]$/g, ''))
      .filter((value) => value !== '');
  }
  return enums;
}

const prismaEnums = readPrismaEnums(read('../prisma/schema.prisma'));
const sharedEnums = readSharedEnums(
  read('../../../packages/shared/src/enums.ts'),
);

let failed = false;

for (const [prismaName, sharedName] of Object.entries(ENUM_PAIRS)) {
  const prismaValues = prismaEnums[prismaName];
  const sharedValues = sharedEnums[sharedName];

  if (!prismaValues || !sharedValues) {
    failed = true;
    if (!prismaValues) {
      console.error(`missing Prisma enum: ${prismaName}`);
    }
    if (!sharedValues) {
      console.error(`missing shared const: ${sharedName}`);
    }
    continue;
  }

  const onlyPrisma = prismaValues.filter((v) => !sharedValues.includes(v));
  const onlyShared = sharedValues.filter((v) => !prismaValues.includes(v));

  if (onlyPrisma.length > 0 || onlyShared.length > 0) {
    failed = true;
    console.error(`enum drift: ${prismaName} <-> ${sharedName}`);
    if (onlyPrisma.length > 0) {
      console.error(`  only in Prisma: ${onlyPrisma.join(', ')}`);
    }
    if (onlyShared.length > 0) {
      console.error(`  only in shared: ${onlyShared.join(', ')}`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('enums in sync');
