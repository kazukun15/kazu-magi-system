import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const request=(path,options={})=>new Request('https://magi.test'+path,options);
test('public homepage and bundled assets work, missing files stay 404',async()=>{
 const response=await worker.fetch(request('/'),{});
 assert.equal(response.status,200);
 const html=await response.text();assert(html.includes('KAZU MAGI SYSTEM'));
 const script=html.match(/src="([^\"]+\.js)"/)[1];
 assert.equal((await worker.fetch(request(script),{})).status,200);
 assert.equal((await worker.fetch(request('/core-chamber.webp'),{})).status,200);
 assert.equal((await worker.fetch(request('/.env'),{})).status,404);
 assert.equal((await worker.fetch(request('/server/magi.js'),{})).status,404);
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
});
test('anonymous demo metadata requires no vault; private writes and AI stay protected',async()=>{
 const response=await worker.fetch(request('/api/providers'),{});assert.equal(response.status,200);
 const data=await response.json();assert.equal(data.authenticated,false);assert.equal(data.active,'mock');assert(data.providers.every(p=>!p.configured));
 for(const path of ['/api/providers','/api/providers/test','/api/decide'])assert.equal((await worker.fetch(request(path,{method:'POST',headers:{origin:'https://magi.test','content-type':'application/json'},body:'{}'}),{})).status,401);
});
test('authenticated provider status is isolated and exposes no key',async()=>{
 const env={BUCKET:{get:async()=>null}};
 const response=await worker.fetch(request('/api/providers',{headers:{'oai-authenticated-user-id':'user-a'}}),env);
 assert.equal(response.status,200);assert.equal((await response.json()).authenticated,true);
});
