const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function build() {
  const outDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const entryPoints = [
    'src/handlers/mockEngine.ts',
    'src/handlers/management.ts'
  ].filter(file => fs.existsSync(path.join(__dirname, file)));

  if (entryPoints.length === 0) {
    console.log('ℹ️  No entry points found yet in src/handlers. Skipping bundle build until handlers are implemented.');
    return;
  }

  console.log(`📦 Bundling ${entryPoints.length} Lambda handlers with esbuild...`);

  await esbuild.build({
    entryPoints: entryPoints.map(f => path.join(__dirname, f)),
    bundle: true,
    platform: 'node',
    target: 'node20',
    outdir: outDir,
    format: 'cjs',
    sourcemap: true,
    minify: false,
    external: ['@aws-sdk/*'] // Built into Node.js 20 runtime on AWS Lambda
  });

  console.log('✅ Lambda handlers built successfully into dist/');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});

