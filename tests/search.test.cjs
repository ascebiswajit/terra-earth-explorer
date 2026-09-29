const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(responses=[]){
 const nodes=new Map(), flights=[],calls=[];
 function element(){return {children:[],style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},addEventListener(){},textContent:'',value:''}}
 const context=vm.createContext({document:{getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element,querySelectorAll(){return []}},window:{},navigator:{},innerWidth:1200,setTimeout,clearTimeout,AbortController,console,fetch:async url=>{calls.push(url);let next=responses.shift();if(next instanceof Error)throw next;return {ok:true,json:async()=>next}}});
 vm.runInContext(fs.readFileSync('dist/app.js','utf8').replace(/init\(\);\s*$/,''),context);
 context.capture=p=>flights.push(p);
 vm.runInContext('fly=p=>capture(p)',context);
 return {context,nodes,flights,calls,run:code=>vm.runInContext(code,context)};
}
const photon=(name='Test Village',lon=85,lat=21)=>({features:[{geometry:{coordinates:[lon,lat]},properties:{name,state:'Odisha',country:'India',type:'locality'}}]});
test('submitted place search moves to its returned coordinates',async()=>{let h=setup([photon()]);await h.run("search('Test Village Odisha')");assert.equal(h.flights[0].lat,21);assert.equal(h.flights[0].lon,85);assert.match(h.nodes.get('searchResults').children.at(-1).textContent,/Showing/)});
test('fallback search works when primary service fails',async()=>{let h=setup([new Error('offline'),{results:[{name:'Example',latitude:22,longitude:86}]}]);await h.run("search('Example')");assert.equal(h.calls.length,2);assert.equal(h.flights[0].lat,22)});
test('invalid coordinates do not move the map or call services',async()=>{let h=setup();await h.run("search('100, 200')");assert.equal(h.flights.length,0);assert.equal(h.calls.length,0)});
test('coordinates work without a geocoding service',async()=>{let h=setup();await h.run("search('20.2961, 85.8245')");assert.equal(h.flights[0].lon,85.8245);assert.equal(h.calls.length,0)});
test('old search response cannot overwrite a newer query',async()=>{let h=setup();let resolve;h.context.fetch=()=>new Promise(r=>{resolve=r});let pending=h.run("search('old')");h.nodes.get('search').oninput();resolve({ok:true,json:async()=>photon()});await pending;assert.equal(h.flights.length,0)});
test('result button navigates to the selected alternative',()=>{let h=setup();h.run("renderResults([{name:'One',lat:1,lon:2},{name:'Two',lat:3,lon:4}])");h.nodes.get('searchResults').children[1].onclick();assert.equal(h.flights[0].name,'Two')});
test('denied device location restores controls and explains recovery',()=>{let h=setup();h.context.navigator.geolocation={getCurrentPosition:(success,error)=>error({code:1})};h.run('locate()');assert.equal(h.nodes.get('useLocation').disabled,false);assert.match(h.nodes.get('searchResults').children[0].textContent,/permission was denied/);h.run('clearTimeout(toastTimer)')});
test('device location uses reported position and accuracy',()=>{let h=setup();h.context.navigator.geolocation={getCurrentPosition:success=>success({coords:{latitude:21,longitude:85,accuracy:30}})};h.run('locate()');assert.equal(h.flights[0].lat,21);assert.match(h.flights[0].desc,/30 metres/)});
