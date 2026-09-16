import test from 'node:test';
import assert from 'node:assert/strict';
import { createSmtpSender } from '../src/mail.mjs';

function smtp({rejectAuth=false}={}) {
  const commands=[];let controller,closed=false;
  const encoder=new TextEncoder();
  const statuses=[250,334,334,rejectAuth?535:235,250,250,354,250,221];
  const socket={
    readable:new ReadableStream({start(c){controller=c;c.enqueue(encoder.encode('220 smtp.example.test\r\n'));}}),
    writable:new WritableStream({write(bytes){const command=new TextDecoder().decode(bytes);commands.push(command);const status=statuses.shift();if(status===250&&commands.length===1)controller.enqueue(encoder.encode('250-smtp.example.test\r\n250 AUTH LOGIN\r\n'));else controller.enqueue(encoder.encode(status+' OK\r\n'));}}),
    async close(){closed=true;controller.close();}
  };
  return {commands,get closed(){return closed;},connect(address,options){assert.equal(address.hostname,'smtp.gmail.com');assert.equal(address.port,465);assert.equal(options.secureTransport,'on');return socket;}};
}
test('SMTP uses implicit TLS, handles multiline replies, sends a single DATA body and closes',async()=>{
  const s=smtp();await createSmtpSender(s.connect)({SMTP_USER:'test@gmail.com',SMTP_PASS:'fake password'},'teacher@kcis.com.tw','012345');
  assert.equal(s.commands.length,9);assert.equal(s.commands[4],'MAIL FROM:<test@gmail.com>\r\n');assert.equal(s.commands[5],'RCPT TO:<teacher@kcis.com.tw>\r\n');
  assert.ok(s.commands[7].endsWith('\r\n.\r\n'));assert.ok(s.commands[7].includes('012345'));assert.ok(s.closed);
});
test('SMTP rejects failed authentication before any recipient or DATA is sent',async()=>{
  const s=smtp({rejectAuth:true});await assert.rejects(()=>createSmtpSender(s.connect)({SMTP_USER:'test@gmail.com',SMTP_PASS:'fake'},'teacher@kcis.com.tw','012345'));
  assert.equal(s.commands.length,4);assert.ok(s.closed);
});
