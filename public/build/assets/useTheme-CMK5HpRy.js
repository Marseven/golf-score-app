import{c as o}from"./createLucideIcon-Cae_JVm4.js";import{r as s}from"./app-Cndp63ZH.js";/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],u=o("menu",h);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],f=o("monitor",d);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]],g=o("moon",i);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],M=o("sun",y);function k(){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function r(e){const n=e==="system"?k():e;document.documentElement.classList.toggle("dark",n==="dark")}function v(){const[e,n]=s.useState(()=>typeof window>"u"?"system":localStorage.getItem("theme")||"system");s.useEffect(()=>{if(r(e),e==="system"){const t=window.matchMedia("(prefers-color-scheme: dark)"),c=()=>r("system");return t.addEventListener("change",c),()=>t.removeEventListener("change",c)}},[e]);const a=s.useCallback(t=>{localStorage.setItem("theme",t),n(t)},[]),m=s.useCallback(()=>{a(e==="light"?"dark":e==="dark"?"system":"light")},[e,a]);return{theme:e,setTheme:a,cycleTheme:m}}export{u as M,M as S,f as a,g as b,v as u};
