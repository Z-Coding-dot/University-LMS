import ts from 'typescript';
import console from 'node:console';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keys = ['users', 'faculties', 'departments', 'academicYears', 'semesters', 'courses', 'offerings', 'enrollments', 'gradeComponents', 'gradeEntries', 'attendanceSessions', 'attendanceRecords', 'lectures', 'assignments', 'submissions', 'announcements', 'settings'];
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: specifier => {
    if (!specifier.startsWith('.')) throw new Error(`Unexpected fixture dependency: ${specifier}`);
    const base = path.resolve(path.dirname(file), specifier);
    const found = [`${base}.ts`, path.join(base, 'index.ts')].find(existsSync);
    if (!found || !found.startsWith(root + path.sep)) throw new Error(`Invalid fixture dependency: ${specifier}`);
    return load(found);
  } }, { filename: file });
  return module.exports;
}
const source = load(path.join(root, 'src/api/mock/fixtures.ts'));
const fixtures = Object.fromEntries(keys.map(k => [k, source[k]]));
fixtures.studyMaterials = load(path.join(root, 'src/api/mock/materials.ts')).studyMaterials;
const target = path.resolve(root, '../backend/database/fixtures');
await mkdir(path.join(target, 'files'), { recursive: true });
await writeFile(path.join(target, 'demo.json'), `${JSON.stringify(fixtures)}\n`);
for (const file of fixtures.studyMaterials) await copyFile(path.join(root, 'public', file.url), path.join(target, 'files', file.name));
console.log(`Exported ${fixtures.users.length} accounts, ${fixtures.offerings.length} offerings and ${fixtures.studyMaterials.length} study packs.`);
