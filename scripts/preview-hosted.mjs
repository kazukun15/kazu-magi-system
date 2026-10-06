import http from 'node:http';
import worker from '../dist/server/index.js';
const port=Number(process.env.PORT||5183);
http.createServer(async(req,res)=>{try{
 const parts=[];for await(const part of req)parts.push(part);
 const request=new Request('http://127.0.0.1:'+port+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(parts)});
 const response=await worker.fetch(request,{});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}catch{res.writeHead(500);res.end('Preview error');}}).listen(port,'127.0.0.1',()=>console.log('Hosted preview: http://127.0.0.1:'+port));
