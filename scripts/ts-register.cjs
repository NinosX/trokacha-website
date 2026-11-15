// scripts/ts-register.cjs
// =============================================================================
// Chargeur TypeScript des scripts de test du site (`node scripts/test-*.cjs`) :
// transpile chaque fichier .ts / .tsx à la volée avec `typescript`, déjà déclaré
// dans les devDependencies (aucune dépendance non déclarée, plus de sucrase).
// Pas de vérification de types ici : `npx tsc --noEmit` la fait.
// =============================================================================

const fs = require('fs');
const ts = require('typescript');

const OPTIONS = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2020,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  isolatedModules: true,
};

for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: OPTIONS, fileName: filename });
    module._compile(outputText, filename);
  };
}
