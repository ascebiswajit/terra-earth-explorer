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
function mapSetup(){
 const h=setup();h.layers=[];
 h.context.mockViewer={resolutionScale:1,scene:{globe:{tileLoadProgressEvent:{addEventListener(){}}},requestRender(){}},camera:{positionCartographic:{height:1500},moveStart:{addEventListener(){}},moveEnd:{addEventListener(){}}},imageryLayers:{removeAll(){h.layers.length=0},addImageryProvider(p){const l={provider:p};h.layers.push(l);return l}}};
 h.context.Cesium={OpenStreetMapImageryProvider:function(){return {type:'street',errorEvent:{addEventListener(){}}}}};
 h.run('viewer=mockViewer');return h;
}
test('satellite provider retains its advertised detail and adds optional labels',async()=>{const h=mapSetup();h.context.provider={maximumLevel:23,errorEvent:{addEventListener(){}}};h.run('arcgisProvider=async()=>provider');await h.run("setLayer('satellite')");assert.equal(h.layers[0].provider.maximumLevel,23);assert.equal(h.layers.length,2);assert.equal(h.layers[1].show,true)});
test('delayed satellite response cannot replace a newer street selection',async()=>{const h=mapSetup();let resolve;h.context.deferred=()=>new Promise(r=>{resolve=r});h.run('arcgisProvider=deferred');const pending=h.run("setLayer('satellite')");await h.run("setLayer('streets')");resolve({errorEvent:{addEventListener(){}}});await pending;assert.equal(h.layers.length,1);assert.equal(h.layers[0].provider.type,'street')});
test('map resolution honors high-density display with 2x cap',()=>{const h=mapSetup();h.context.window.devicePixelRatio=3;h.run('configureMapDetail()');assert.equal(h.context.mockViewer.resolutionScale,2/3);assert.equal(h.context.mockViewer.scene.globe.maximumScreenSpaceError,1)});
