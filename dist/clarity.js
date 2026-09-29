/* Tile availability is not a guarantee of photographic resolution. */
(function(root){
 const cache=new Map();
 function tile(lat,lon,level){
  const n=2**level,r=Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/180;
  return {x:Math.max(0,Math.min(n-1,Math.floor((lon+180)/360*n))),y:Math.max(0,Math.min(n-1,Math.floor((1-Math.asinh(Math.tan(r))/Math.PI)/2*n)))};
 }
 function desiredLevel(lat,metresPerPixel){return Math.max(0,Math.min(23,Math.ceil(Math.log2(156543.03392*Math.cos(lat*Math.PI/180)/metresPerPixel))))}
 async function available(lat,lon,level,signal){
  const {x,y}=tile(lat,lon,level),key=`${level}/${y}/${x}`,old=cache.get(key);
  if(old&&Date.now()-old.time<300000)return old.value;
  const res=await fetch(`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tilemap/${key}/1/1?f=json`,{signal});
  if(!res.ok&&res.status!==422)throw Error('Availability service unavailable');
  const data=await res.json();let value;
  if(res.status===422||data.error?.code===422)value=false;
  else if(data.data?.[0]===0||data.data?.[0]===1)value=data.data[0]===1;
  else throw Error('Unknown tile availability');
  if(cache.size>=256)cache.delete(cache.keys().next().value);
  cache.set(key,{time:Date.now(),value});return value;
 }
 async function inspect(lat,lon,desired,signal,lookup=available){
  if(await lookup(lat,lon,desired,signal))return {limited:false,level:desired};
  // Find a usable lower level; cached imagery pyramids contain parent tiles.
  let low=0,high=desired-1,best=null;
  while(low<=high){const mid=Math.floor((low+high)/2);if(await lookup(lat,lon,mid,signal)){best=mid;low=mid+1}else high=mid-1}
  return {limited:true,level:best};
 }
 root.TerraClarity={tile,desiredLevel,inspect};
})(typeof window==='undefined'?globalThis:window);
