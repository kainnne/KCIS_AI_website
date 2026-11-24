function bytes(base64) {return Uint8Array.from(atob(base64),c=>c.charCodeAt(0));}
export async function unlockVault(pin, envelope) {
  if(!/^\d{4}$/.test(pin))throw new Error('請輸入四碼密碼');
  if(envelope.version!==1||envelope.algorithm!=='AES-GCM')throw new Error('題庫格式不相容');
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(envelope.salt),iterations:envelope.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(envelope.iv)},key,bytes(envelope.ciphertext));
  const bank=JSON.parse(new TextDecoder().decode(plaintext));
  if(bank.schemaVersion!==1||bank.questions.length<584||bank.units.length!==10)throw new Error('題庫完整性檢查失敗');
  return bank;
}
