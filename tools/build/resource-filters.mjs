import {packMeshBytes,unpackMeshBytes} from '../../source/src/effects/dragon-summon-hd/mesh-bytes.js';

// The archive stores PCM changes and triangle indices relative to a predictor.
// Splitting the two byte planes lets Brotli compress the many repeated high bytes.
function* wordRanges(input,filter) {
  const [kind,ranges]=filter;
  if(!['pcm16','mesh','indices'].includes(kind))throw Error('Unknown resource filter '+kind);
  let end=0;
  for(const [offset,count] of kind==='pcm16'?[[44,(input.length-44)/2]]:ranges){
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(count)||offset<end||count<0||count>(input.length-offset)/2){
      throw Error('Invalid 16-bit resource range');
    }
    end=offset+count*2;
    yield [offset,count];
  }
}

export function encodeResource(input,filter) {
  const pcm=filter[0]==='pcm16',mesh=filter[0]==='mesh',output=new Uint8Array(input);
  for(const [offset,count] of wordRanges(input,filter)){
    let reference=0;
    for(let i=0;i<count;i++){
      const word=offset+i*2,value=input[word]|(input[word+1]<<8);
      const code=pcm?value-reference:reference-value;
      // Mesh bytes pass through a four-plane shuffle for the float coordinates.
      output[mesh?word:offset+i]=code;
      output[mesh?word+1:offset+count+i]=code>>>8;
      reference=pcm?value:Math.max(reference,value+1);
    }
  }
  return mesh?packMeshBytes(output):output;
}

export function decodeResource(payload,filter) {
  const pcm=filter[0]==='pcm16',mesh=filter[0]==='mesh';
  const input=mesh?unpackMeshBytes(payload):payload;
  if(mesh&&(input===payload||input.length%4))throw Error('Invalid packed mesh');
  const output=mesh?input:new Uint8Array(input);
  for(const [offset,count] of wordRanges(input,filter)){
    let reference=0;
    for(let i=0;i<count;i++){
      const word=offset+i*2,low=mesh?word:offset+i,high=mesh?word+1:offset+count+i;
      const code=input[low]|(input[high]<<8);
      const value=(pcm?reference+code:reference-code)&65535;
      output[word]=value;
      output[word+1]=value>>>8;
      reference=pcm?value:Math.max(reference,value+1);
    }
  }
  return output;
}
