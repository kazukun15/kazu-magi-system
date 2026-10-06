import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {handleApi} from '../server/magi.js';

const store=new Map();
const env={
  MAGI_VAULT_KEY:Buffer.alloc(32,8).toString('base64'),
  BUCKET:{
    get:async k=>store.has(k)?{json:async()=>JSON.parse(store.get(k))}:null,
    put:async(k,v)=>{store.set(k,v)},
    delete:async k=>{store.delete(k)}
  }
};

const nativeFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
  if(new URL(url).hostname==='generativelanguage.googleapis.com'){
    const payload=JSON.parse(options.body);
    const jsonMode=payload.generationConfig?.responseMimeType==='application/json';
    return Response.json({candidates:[{content:{parts:[{text:jsonMode?JSON.stringify({
      verdict:'APPROVE_WITH_CHANGES',
      score:81,
      summary:'テスト評価：段階的な実装を推奨します。',
      reasons:['実現性'],
      concerns:['情報の確認'],
      recommendations:['小さく検証'],
      minorityReport:{core:'MELCHIOR',reason:'代替案も検討'}
    }):'接続成功'}]}}]});
  }
  return nativeFetch(url,options);
};

const root=path.resolve('.');
const mime=file=>file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.webp')?'image/webp':'application/octet-stream';

const server=createServer(async(req,res)=>{
  try{
    const host=req.headers.host;
    const url=new URL(req.url,'http://'+host);
    if(url.pathname.startsWith('/api/')){
      const chunks=[];
      for await(const c of req)chunks.push(c);
      const headers=new Headers(req.headers);
      headers.set('oai-authenticated-user-id','local-test');
      const request=new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
      const response=await handleApi(request,env);
      res.writeHead(response.status,Object.fromEntries(response.headers));
      if(response.body){
        const reader=response.body.getReader();
        while(true){
          const r=await reader.read();
          if(r.done)break;
          res.write(Buffer.from(r.value));
        }
      }
      res.end();
      return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let decoded;
    try{decoded=decodeURIComponent(url.pathname)}catch{res.writeHead(400);res.end();return;}
    let file=decoded==='/'?path.join(root,'dist','index.html'):path.resolve(root,'dist','.'+decoded);
    const distRoot=path.join(root,'dist')+path.sep;
    if(file!==path.join(root,'dist','index.html')&&!file.startsWith(distRoot)){res.writeHead(404);res.end();return;}
    try{
      const bytes=await readFile(file);
      res.setHeader('content-type',mime(file));
      res.end(req.method==='HEAD'?undefined:bytes);
    }catch{
      try{
        const bytes=await readFile(path.join(root,'dist','index.html'));
        res.setHeader('content-type','text/html; charset=utf-8');
        res.end(req.method==='HEAD'?undefined:bytes);
      }catch{res.writeHead(404);res.end('Not found');}
    }
  }catch{
    res.writeHead(500);res.end('Test server error');
  }
});

await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  for(const testPath of ['tests/qa.mjs','tests/ai-ui.mjs','tests/local.test.mjs']){
    const code=await new Promise(resolve=>{
      const child=spawn(process.execPath,[testPath],{
        stdio:'inherit',
        env:{...process.env,QA_BASE_URL:'http://127.0.0.1:'+server.address().port}
      });
      child.on('exit',resolve);
    });
    if(code!==0){process.exitCode=1;break;}
  }
}finally{
  server.close();
  globalThis.fetch=nativeFetch;
}
