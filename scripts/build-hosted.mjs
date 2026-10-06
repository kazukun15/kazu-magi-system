import {build as viteBuild} from 'vite';
import {build as bundle} from 'esbuild';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
await viteBuild({build:{outDir:'dist/client'}});
const assets={};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon'};
async function collect(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const name=prefix+'/'+entry.name;const file=path.join(dir,entry.name);if(entry.isDirectory())await collect(file,name);else assets[name]={base64:(await readFile(file)).toString('base64'),type:types[path.extname(file)]||'application/octet-stream'};}}
await collect('dist/client');
await mkdir('.site-build',{recursive:true});
await writeFile('.site-build/assets.js','export default '+JSON.stringify(assets)+';\n');
await mkdir('dist/server',{recursive:true});
await bundle({entryPoints:['server/hosted.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log('Hosted Worker built with '+Object.keys(assets).length+' embedded assets.');
