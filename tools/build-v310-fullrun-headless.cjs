const fs=require('fs');
const crypto=require('crypto');

const file='src/game-v310.js';
let src=fs.readFileSync(file,'utf8');
const original=src;

function mustReplace(before,after,label){
  const first=src.indexOf(before);
  if(first<0)throw new Error(`V3.10 headless transform miss: ${label}`);
  if(src.indexOf(before,first+1)>=0)throw new Error(`V3.10 headless transform ambiguous: ${label}`);
  src=src.slice(0,first)+after+src.slice(first+before.length);
}

mustReplace(
  'localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true',
  'if(!globalThis.__V310_FULLRUN_HEADLESS__)localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true',
  'skip persistence serialization only after fresh-save bootstrap'
);

mustReplace(
  'function render(){if(!state)return;',
  'function render(){if(globalThis.__V310_FULLRUN_HEADLESS__){renderSect();renderDwelling();renderSecretRealm();return}if(!state)return;',
  'minimal headless render preserving runner-required UI handlers'
);

mustReplace(
  "newGame:(name='测试者')=>{newState(name);updateMajorEvents();render();return true}",
  "newGame:(name='测试者')=>{newState(name);updateMajorEvents();render();globalThis.__V310_FULLRUN_HEADLESS__=true;return true}",
  'enable headless mode only after a normal fresh-game render'
);

if(!src.includes('advanceDays(days){for(let i=0;i<days&&!state.flags.dead;i++)tickOneDay();v33DecayAlchemy(days);'))throw new Error('advanceDays gameplay loop missing after headless transform');
if(!src.includes('function tickOneDay(){'))throw new Error('world-day simulation missing after headless transform');
if(!src.includes('syncV35EconomyState();syncV36VoidState();syncV37UnityState();syncV38MahayanaState();syncV39FinaleState();'))throw new Error('save synchronization chain missing after headless transform');

fs.writeFileSync(file,src);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const report={
  status:'PASS',
  mode:'fullrun-headless-ui-persistence-only',
  original_sha256:sha(original),
  headless_sha256:sha(src),
  replacements:3,
  preserved:[
    'tickOneDay and advanceDays',
    'all RNG and gameplay functions',
    'save synchronization chain',
    'sect/dwelling/secret-realm UI handlers required by legal runner'
  ],
  suppressed:[
    'repeated localStorage JSON serialization after fresh-game bootstrap',
    'nonessential DOM rendering after fresh-game bootstrap'
  ]
};
fs.writeFileSync('/tmp/V310_HEADLESS.json',JSON.stringify(report,null,2)+'\n');
console.log('V310_HEADLESS_PASS',JSON.stringify(report));
