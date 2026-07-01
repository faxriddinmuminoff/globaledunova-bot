import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

const REQUIRED_DIRS = [
  'src/queue',
  'src/rbac',
  'src/broadcast',
  'src/telegram',
] as const;

const REQUIRED_MIGRATIONS = [
  'src/database/migrations/006_queue_hardening.sql',
  'src/database/migrations/007_upload_idempotency.sql',
  'src/database/migrations/008_broadcast_delivery_idempotency.sql',
  'src/database/migrations/009_reminder_event_idempotency.sql',
] as const;

const IMPORT_PATTERN =
  /from\s+['"](?:\.\.?\/)+(?:queue|rbac|broadcast|telegram)(?:\/[^'"]+)?['"]/g;

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

function resolveImport(fromFile: string, importPath: string): string | null {
  const base = path.resolve(path.dirname(fromFile), importPath);
  const candidates = [
    base,
    `${base}.ts`,
    path.join(base, 'index.ts'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function listTrackedFiles(): Set<string> {
  try {
    const output = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
    return new Set(
      output
        .split(/\r?\n/)
        .filter(Boolean)
        .map((f) => f.replace(/\\/g, '/')),
    );
  } catch {
    return new Set();
  }
}

function main(): void {
  const missingOnDisk: string[] = [];
  const missingImports: { file: string; importPath: string }[] = [];
  const untracked: string[] = [];

  for (const relDir of REQUIRED_DIRS) {
    const absDir = path.join(ROOT, relDir);
    if (!fs.existsSync(absDir)) {
      missingOnDisk.push(relDir);
      continue;
    }
    const files = collectSourceFiles(absDir);
    if (files.length === 0) {
      missingOnDisk.push(`${relDir} (empty or missing .ts files)`);
    }
  }

  for (const relMigration of REQUIRED_MIGRATIONS) {
    const abs = path.join(ROOT, relMigration);
    if (!fs.existsSync(abs)) {
      missingOnDisk.push(relMigration);
    }
  }

  const srcDir = path.join(ROOT, 'src');
  const allSrc = collectSourceFiles(srcDir);
  for (const file of allSrc) {
    const content = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    IMPORT_PATTERN.lastIndex = 0;
    while ((match = IMPORT_PATTERN.exec(content)) !== null) {
      const fullMatch = match[0];
      const importPath = fullMatch.match(/['"]([^'"]+)['"]/)?.[1];
      if (!importPath) continue;
      const resolved = resolveImport(file, importPath);
      if (!resolved) {
        missingImports.push({
          file: path.relative(ROOT, file).replace(/\\/g, '/'),
          importPath,
        });
      }
    }
  }

  const tracked = listTrackedFiles();
  if (tracked.size > 0) {
    for (const relDir of REQUIRED_DIRS) {
      const absDir = path.join(ROOT, relDir);
      if (!fs.existsSync(absDir)) continue;
      for (const file of collectSourceFiles(absDir)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        if (!tracked.has(rel)) {
          untracked.push(rel);
        }
      }
    }
    for (const relMigration of REQUIRED_MIGRATIONS) {
      if (fs.existsSync(path.join(ROOT, relMigration)) && !tracked.has(relMigration)) {
        untracked.push(relMigration);
      }
    }
  }

  const errors: string[] = [];

  if (missingOnDisk.length > 0) {
    errors.push('Missing required modules on disk:');
    for (const item of missingOnDisk) {
      errors.push(`  - ${item}`);
    }
  }

  if (missingImports.length > 0) {
    errors.push('Imports reference modules that do not exist:');
    for (const item of missingImports) {
      errors.push(`  - ${item.file} -> ${item.importPath}`);
    }
  }

  if (untracked.length > 0) {
    errors.push('Required modules exist locally but are not tracked in git:');
    for (const item of untracked.sort()) {
      errors.push(`  - ${item}`);
    }
  }

  if (errors.length > 0) {
    console.error('Commit completeness check failed:\n');
    for (const line of errors) {
      console.error(line);
    }
    console.error(
      '\nFresh clone requires all imported modules to be committed. Add missing files and retry.',
    );
    process.exit(1);
  }

  console.log('Commit completeness check passed.');
}

main();
