import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { offers, markOfferPaid } from '../server/offers.mjs';
import { SERVICES, BUSINESS } from '../dist/js/data.js';

test('signed coupons, persistent qualified leads and retryable service payment', async t => {
  process.env.OFFER_DB_PATH = ':memory:';
  process.env.OFFER_ADMIN_KEY = 'staff-secret';
  const keys = generateKeyPairSync('rsa',{modulusLength:2048});
  t.mock.method(globalThis,'fetch',async () => Response.json({test:keys.publicKey.export({type:'spki',format:'pem'})}));
  function bearer(uid) {
    const now=Math.floor(Date.now()/1000), project='vintorex-digital-solutions-024';
    const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
    const content=encode({alg:'RS256',kid:'test'})+'.'+encode({sub:uid,email:uid+'@example.test',iat:now,exp:now+300,aud:project,iss:'https://securetoken.google.com/'+project});
    return 'Bearer '+content+'.'+sign('RSA-SHA256',Buffer.from(content),keys.privateKey).toString('base64url');
  }
  let created=0,paid=false;
  const razorpay=async (_path,body)=>body?{id:'order_'+(++created)}:{status:paid?'paid':'created'};
  const call=(endpoint,body,headers={})=>offers({method:body?'POST':'GET',headers},'/api/offers/'+endpoint,{
    readJson:async()=>body,limit(){},razorpay,sign:()=> 'signed',payments:true,keyId:'test'
  });
  const one={authorization:bearer('first')},two={authorization:bearer('second')};
  const scratch=await call('draw',{});
  assert.ok(scratch.amount>=7999 && scratch.amount<=9999);
  const s=SERVICES.find(s=>s.tiers[0].price>9999),tier=s.tiers[0];
  const input={...scratch,name:'Test customer',service:s.id,tier:tier.name,goal:'Test project'};
  await assert.rejects(call('claim',input),{status:401});
  await assert.rejects(call('claim',{...input,amount:10000},one),{status:400});
  const claim=await call('claim',input,one);
  const net=tier.price-scratch.amount;
  assert.equal(claim.total,net+Math.round(net*BUSINESS.gst/100));
  assert.equal((await call('claim',{...input,...await call('draw',{})},one)).code,claim.code);
  await assert.rejects(call('claim',input,two),{status:409});
  assert.equal((await call('me',undefined,one)).claim.code,claim.code);
  const cheap=SERVICES.find(s=>s.tiers[0].price<=5000);
  const free=await call('claim',{...input,...await call('draw',{}),service:cheap.id,tier:cheap.tiers[0].name},two);
  assert.equal(free.total,0);
  assert.equal(free.paid,1);
  await assert.rejects(call('admin'),{status:403});
  const staff={'x-offer-admin-key':'staff-secret'};
  await call('admin',{uid:'first',followup:'2026-12-01',note:'Discuss scope'},staff);
  assert.equal((await call('admin',undefined,staff)).find(r=>r.uid==='first').note,'Discuss scope');
  const order=await call('pay',{},one);
  assert.equal(order.amount,claim.total*100);
  assert.equal((await call('pay',{},one)).orderId,order.orderId);
  assert.equal(created,1);
  await markOfferPaid('first','wrong-order');
  assert.equal((await call('me',undefined,one)).claim.paid,0);
  paid=true;
  assert.equal((await call('pay',{},one)).paid,true);
  assert.equal((await call('me',undefined,one)).claim.paid,1);
});
