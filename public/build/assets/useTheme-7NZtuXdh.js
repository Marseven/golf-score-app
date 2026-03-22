import{c as n}from"./createLucideIcon-Gx7UhCMz.js";import{r as s}from"./app-CHmUjMpC.js";/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],u=n("monitor",h);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]],p=n("moon",d);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],f=n("sun",i);function y(){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function r(e){const o=e==="system"?y():e;document.documentElement.classList.toggle("dark",o==="dark")}function g(){const[e,o]=s.useState(()=>typeof window>"u"?"system":localStorage.getItem("theme")||"system");s.useEffect(()=>{if(r(e),e==="system"){const t=window.matchMedia("(prefers-color-scheme: dark)"),a=()=>r("system");return t.addEventListener("change",a),()=>t.removeEventListener("change",a)}},[e]);const c=s.useCallback(t=>{localStorage.setItem("theme",t),o(t)},[]),m=s.useCallback(()=>{c(e==="light"?"dark":e==="dark"?"system":"light")},[e,c]);return{theme:e,setTheme:c,cycleTheme:m}}export{u as M,f as S,p as a,g as u};
