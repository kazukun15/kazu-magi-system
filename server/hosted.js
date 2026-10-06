import {handleApi, PROVIDERS} from './magi.js';
import assets from '../.site-build/assets.js';

const headers = {'x-content-type-options':'nosniff','referrer-policy':'no-referrer','permissions-policy':'camera=(), microphone=(), geolocation=()','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://chatgpt.com"};
function status(authenticated){return {active:'mock',hosted:true,authenticated,providers:Object.entries(PROVIDERS).map(([id,p])=>({id,name:p.name,model:p.model,configured:false,testedAt:null})),security:'server-encrypted'};}
export default {async fetch(request,env){
  const path=new URL(request.url).pathname;
  const authenticated=!!request.headers.get('oai-authenticated-user-id');
  if(path.startsWith('/api/')){
    if(path==='/api/providers'&&request.method==='GET'){
      if(!authenticated)return Response.json(status(false),{headers:{...headers,'cache-control':'no-store'}});
      const response=await handleApi(request,env);
      if(!response.ok)return response;
      return Response.json({...await response.json(),hosted:true,authenticated:true},{headers:{...headers,'cache-control':'no-store'}});
    }
    return handleApi(request,env);
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
  const file=assets[path==='/'?'/index.html':path];
  if(!file)return new Response('Not found',{status:404,headers});
  const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0));
  return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'content-type':file.type,'cache-control':path.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'}});
}};
