// Implicit TLS: credentials are never sent before TLS establishment.
export function createSmtpSender(connect) { return async function sendMail(env, email, code) {
  const socket=connect({hostname:'smtp.gmail.com',port:465},{secureTransport:'on'});
  const reader=socket.readable.getReader(),writer=socket.writable.getWriter();
  const decoder=new TextDecoder(),encoder=new TextEncoder();let pending='';
  let timer;
  const work=async()=>{
    async function response(expected) {
      let total=0;
      while(true){
        const at=pending.indexOf('\r\n');
        if(at<0){const {value,done}=await reader.read();if(done)throw Error('SMTP closed');pending+=decoder.decode(value,{stream:true});if(pending.length>20000)throw Error('SMTP response too large');continue;}
        const line=pending.slice(0,at);pending=pending.slice(at+2);total+=line.length;
        if(total>20000)throw Error('SMTP response too large');
        if(!/^\d{3}[- ]/.test(line))throw Error('SMTP response malformed');
        if(line[3]===' '){if(Number(line.slice(0,3))!==expected)throw Error('SMTP rejected');return;}
      }
    }
    async function command(text,status){await writer.write(encoder.encode(text+'\r\n'));await response(status);}
    await response(220);await command('EHLO ai-tools.kcis.kainnne.com',250);
    await command('AUTH LOGIN',334);await command(btoa(env.SMTP_USER),334);await command(btoa(env.SMTP_PASS.replace(/\s/g,'')),235);
    if(!/^[a-zA-Z0-9._+%-]+@gmail\.com$/.test(env.SMTP_USER))throw Error('Unexpected sender');
    await command(`MAIL FROM:<${env.SMTP_USER}>`,250);await command(`RCPT TO:<${email}>`,250);await command('DATA',354);
    const body=`KCIS AI Forum\r\n\r\n${code}\r\n\r\nValid for 10 minutes.\r\n`;
    await command(`From: KCIS AI Forum <${env.SMTP_USER}>\r\nTo: <${email}>\r\nSubject: KCIS AI Forum - ${code}\r\nDate: ${new Date().toUTCString()}\r\nMessage-ID: <${crypto.randomUUID()}@ai-tools.kcis.kainnne.com>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 7bit\r\n\r\n${body}\r\n.`,250);
    // DATA acceptance is the delivery handoff. QUIT failure must not invalidate it.
    try{await command('QUIT',221);}catch{}
  };
  try {await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('SMTP timeout')),20000);})]);}
  finally{clearTimeout(timer);try{await socket.close();}catch{}reader.releaseLock();writer.releaseLock();}
}; }
