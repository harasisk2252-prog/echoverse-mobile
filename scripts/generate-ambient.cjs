// Original synthesized ambience: no third-party audio licensing or network calls.
const fs=require('node:fs');
const rate=16000,seconds=12,n=rate*seconds,b=Buffer.alloc(44+n*2);
b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
for(let i=0;i<n;i++){const t=i/rate,fade=Math.min(1,t/2,(seconds-t)/2);const v=[130.833333,196,261.666667].reduce((v,f,j)=>v+Math.sin(2*Math.PI*f*t)/(j+2),0);b.writeInt16LE(Math.round(v*fade*3200),44+i*2);}
fs.mkdirSync('assets',{recursive:true});fs.writeFileSync('assets/ambient.wav',b);
