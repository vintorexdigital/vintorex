import http from 'node:http';
import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {BlockList} from 'node:net';
import {pipeline} from 'node:stream/promises';

const blocked = new BlockList();
for (const [address,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]]) blocked.addSubnet(address,prefix);
const error = message => Object.assign(new Error(message),{status:422});
async function openPublic(value,signal,range) {
  let url;
  try {url=new URL(value);} catch {throw error('Invalid URL.');}
  for (let redirects=0;redirects<=4;redirects++) {
    if (!['https:','http:'].includes(url.protocol) || url.username || url.password || url.port || url.href.length>8192) throw error('Enter a standard public HTTP or HTTPS URL.');
    const {address}=await lookup(url.hostname,{family:4}).catch(()=>{throw error('Could not resolve this website.');});
    if (blocked.check(address)) throw error('This address is not a public internet source.');
    const transport=url.protocol==='https:'?https:http;
    const response=await new Promise((resolve,reject)=>{
      const req=transport.get(url,{hostname:address,servername:url.hostname,agent:false,signal,headers:{Host:url.host,'Accept-Encoding':'identity',...(range?{Range:range}:{})}},resolve);
      req.on('error',()=>reject(error('Could not connect to this source.')));
    });
    if ([301,302,303,307,308].includes(response.statusCode) && response.headers.location) {
      response.destroy();url=new URL(response.headers.location,url);continue;
    }
    if (![200,206].includes(response.statusCode)) {response.destroy();throw error('The source returned HTTP '+response.statusCode+'.');}
    return {url,response};
  }
  throw error('Too many redirects.');
}
const isPage = headers => /(?:text\/html|application\/xhtml\+xml)/i.test(headers['content-type'] || '') && !/^attachment/i.test(headers['content-disposition'] || '');
export async function inspectPublic(value) {
  const {url,response}=await openPublic(value,AbortSignal.timeout(15000));
  if (!isPage(response.headers)) {response.destroy();return {file:url.href};}
  const chunks=[];let size=0;
  for await (const chunk of response) {
    size+=chunk.length;
    if(size>4*1024*1024) {response.destroy();throw error('Page exceeds the 4 MB analysis limit.');}
    chunks.push(chunk);
  }
  return {html:Buffer.concat(chunks).toString('utf8'),url:url.href};
}
export async function savePublic(value,req,res) {
  const controller=new AbortController();
  res.once('close',()=>controller.abort());
  const range=/^bytes=\d*-\d*$/.test(req.headers.range || '')?req.headers.range:null;
  const {url,response}=await openPublic(value,AbortSignal.any([controller.signal,AbortSignal.timeout(1800000)]),range);
  if(isPage(response.headers)) {response.destroy();throw error('This URL is a page. Analyse it to find linked files.');}
  const filename=(url.pathname.split('/').pop() || 'download').replace(/[^\w.-]/g,'_').slice(-150);
  const headers={'Content-Disposition':'attachment; filename="'+filename+'"','Content-Type':'application/octet-stream','Cache-Control':'no-store'};
  for (const key of ['content-length','content-range','accept-ranges']) if(response.headers[key]) headers[key]=response.headers[key];
  res.writeHead(response.statusCode,headers);
  await pipeline(response,res);
}
