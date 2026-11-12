'use client';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './LogoLoop.css';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const SMOOTH_TAU = 0.25;
const GLIDE_TAU = 0.8;
const DRAG_THRESHOLD = 6;
const MAX_FLING = 4000;
const INTRO_TIME = 0.7;
const INTRO_STAGGER = 0.45;
const HALF_SQRT_PI = Math.sqrt(Math.PI) / 2;
const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));
const toCssLength = v => (typeof v === 'number' ? `${v}px` : (v ?? undefined));
const erf = x => { const a=Math.abs(x),t=1/(1+0.3275911*a),y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-a*a); return x<0?-y:y; };
const easeInOut = t => t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeOut = t => 1-Math.pow(1-t,3);
const smootherstep = t => t*t*t*(t*(t*6-15)+10);

const fadeMask = (size, vertical) => {
  const span = clamp(size,0,0.5)*100; if(span<=0)return undefined;
  const stops=[];
  for(let i=0;i<=12;i++) stops.push(`rgba(0,0,0,${smootherstep(i/12).toFixed(4)}) ${((span*i)/12).toFixed(3)}%`);
  for(let i=12;i>=0;i--) stops.push(`rgba(0,0,0,${smootherstep(i/12).toFixed(4)}) ${(100-(span*i)/12).toFixed(3)}%`);
  return `linear-gradient(${vertical?'to bottom':'to right'}, ${stops.join(', ')})`;
};

const createEngine = (root, track, config, setLayout) => {
  const query = typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  const st = {
    offset:0,velocity:0,period:0,length:0,box:[0,0],items:[],snaps:[],pitch:0,crossMax:0,sizeMax:0,tipMax:0,
    geo:null,layout:{copies:2,primary:0},hovered:false,focused:false,pointer:null,pointerInside:false,
    mag:0,magU:0,magReady:false,drag:null,glide:false,suppressUntil:0,pressedAt:-1e9,move:null,hold:0,
    seek:null,scrollVel:0,scrollY:window.scrollY,scrollT:0,
    visible:typeof IntersectionObserver==='undefined',introStart:-1,introDone:!config.current.intro,
    itemMode:false,active:null,raf:0,last:0,reduced:!!query?.matches,destroyed:false
  };

  const collect=()=>{ const items=[]; Array.from(track.children).forEach((list,copy)=>{ Array.from(list.children).forEach((el,index)=>{ items.push({el,copy,index,content:el.children[0]||null,tip:el.children[1]||null,center:0,size:0,cross:0,t:'',o:'',v:'',z:'',s:'',p:''}); }); }); st.items=items; st.active=null; };
  const clearItems=()=>{ for(const it of st.items){it.el.style.transform='';it.el.style.opacity='';it.el.style.visibility='';it.el.style.zIndex='';if(it.content)it.content.style.transform='';if(it.tip)it.tip.style.transform='';it.t=it.o=it.v=it.z=it.s=it.p='';} };

  const geometry=()=>{
    const cfg=config.current,L=st.length,P=st.period,hc=st.crossMax,w=st.sizeMax;
    const geo={mode:cfg.layout,shift:0,uMin:-L/2-w,uMax:L/2+w,lead:0,focus:clamp(cfg.focus,0,1)*0.9,focusSigma:Math.max(40,L*0.18),magnify:clamp(cfg.magnify,0,1),magSigma:Math.max(hc*1.4,st.pitch*1.1),amp:0,k:0,R:0,sign:1,limit:0,C:0,alpha:0,depth:0,pf:1,tilted:false,tiltX:0,tiltY:0,m:[1,0,0,0,1,0,0,0,1],persp:0};
    let pad=cfg.scaleOnHover?hc*0.1:0;
    const lens=(1+geo.focus)*(1+geo.magnify)-1;
    pad+=(lens*hc)/2;
    if(cfg.labels==='hover')pad+=cfg.vertical?st.tipMax:hc*0.2+Math.max(11,hc*0.26)*1.3;
    const extra=cfg.links?2:0;
    geo.lead=(Math.max(0,Math.ceil((-geo.uMin-L/2)/P))+extra)*P;
    const copies=Math.max(2,Math.ceil((geo.uMax+L/2+geo.lead)/P)+2+(extra?1:0));
    const primary=Math.min(copies-1,Math.floor((geo.lead+L/2)/P));
    st.geo=geo;
    root.style.setProperty('--logoloop-pad',`${Math.ceil(pad)}px`);
    if(copies!==st.layout.copies||primary!==st.layout.primary){st.layout={copies,primary};setLayout(st.layout);}
  };

  const measure=()=>{
    const cfg=config.current,lists=track.children;
    if(!lists.length||!st.items.length){st.period=0;return;}
    if(!cfg.vertical&&root.style.height)root.style.height='';
    track.style.transform='none'; clearItems();
    const rootRect=root.getBoundingClientRect(),k=root.offsetWidth?rootRect.width/root.offsetWidth||1:1;
    const trackRect=track.getBoundingClientRect(),origin=cfg.vertical?trackRect.top:trackRect.left;
    let crossMax=0,sizeMax=0,tipMax=0;
    for(const it of st.items){const r=it.el.getBoundingClientRect();it.center=((cfg.vertical?r.top+r.height/2:r.left+r.width/2)-origin)/k;it.size=(cfg.vertical?r.height:r.width)/k;it.cross=(cfg.vertical?r.width:r.height)/k;crossMax=Math.max(crossMax,it.cross);sizeMax=Math.max(sizeMax,it.size);if(it.tip&&it.copy===0)tipMax=Math.max(tipMax,it.tip.offsetWidth);}
    const a=lists[0].getBoundingClientRect(),b=lists[1]?lists[1].getBoundingClientRect():null;
    st.period=(b?(cfg.vertical?b.top-a.top:b.left-a.left):cfg.vertical?a.height:a.width)/k;
    const cs=getComputedStyle(root);
    st.box=[root.offsetWidth,root.offsetHeight];
    st.length=cfg.vertical?root.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom):root.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    st.crossMax=crossMax;st.sizeMax=sizeMax;st.tipMax=tipMax+crossMax*0.25;
    const first=st.items.filter(it=>it.copy===0);
    st.pitch=first.length?st.period/first.length:st.period;
    st.snaps=first.map(it=>it.center);
    st.itemMode=false;
    if(st.period<=0)return;
    geometry();
  };

  const write=(it,key,prop,value,target)=>{if(it[key]!==value){it[key]=value;target.style[prop]=value;}};

  const render=now=>{
    const cfg=config.current,geo=st.geo,L=st.length,half=L/2,T=-st.offset-geo.lead;
    const lineT=cfg.vertical?`translate3d(0px,${T.toFixed(2)}px,0px)`:`translate3d(${T.toFixed(2)}px,0px,0px)`;
    track.style.transform=lineT;
    const elapsed=st.introStart>=0?(now-st.introStart)/1000:0;
    const lensFocus=geo.focus,lensMag=geo.magnify*st.mag;
    const needItems=lensFocus>0||lensMag>0.0005||st.introStart>=0;
    if(!needItems&&st.itemMode)clearItems();
    st.itemMode=needItems;
    let best=null,bestDist=Infinity;
    for(const it of st.items){
      const u=T+it.center-half;let x=u,y=0,scale=1,opacity=1,hidden=false,dist=Math.abs(u);
      if(lensFocus>0){const kf=u/geo.focusSigma;scale*=1+lensFocus*Math.exp(-kf*kf);opacity*=1-0.45*lensFocus*(1-Math.exp(-((u/(geo.focusSigma*1.8))**2)));x+=lensFocus*geo.focusSigma*HALF_SQRT_PI*erf(kf);}
      if(lensMag>0){const km=(x-st.magU)/geo.magSigma;scale*=1+lensMag*Math.exp(-km*km);x+=lensMag*geo.magSigma*HALF_SQRT_PI*erf(km);}
      if(st.introStart>=0&&!hidden){const pos=clamp((x+half)/Math.max(1,L),0,1);const e=easeOut(clamp((elapsed-pos*INTRO_STAGGER)/INTRO_TIME,0,1));opacity*=e;y+=(1-e)*14;}
      if(!needItems)continue;
      const along=x-u;
      const t=hidden?'':`translate3d(${cfg.vertical?`${y.toFixed(2)}px,${along.toFixed(2)}px`:`${along.toFixed(2)}px,${y.toFixed(2)}px`},0px)`;
      write(it,'t','transform',t,it.el);
      write(it,'o','opacity',hidden?'0':opacity>0.999?'':opacity.toFixed(3),it.el);
      write(it,'v','visibility',hidden?'hidden':'',it.el);
      if(it.content)write(it,'s','transform',Math.abs(scale-1)<0.0005?'':`scale(${scale.toFixed(4)})`,it.content);
    }
    const active=best&&bestDist<Math.max(best?.size||0,st.pitch)/2+1?best:null;
    if(active!==st.active){st.active?.el.removeAttribute('data-active');active?.el.setAttribute('data-active','');st.active=active;}
  };

  const frame=now=>{
    st.raf=0;if(st.destroyed||!st.geo||st.period<=0)return;
    const cfg=config.current,dt=st.last?clamp((now-st.last)/1000,0,0.1):0;st.last=now;
    let busy=false;
    if(st.introStart===-1&&!st.introDone&&st.visible){if(cfg.intro&&!st.reduced)st.introStart=now;else st.introDone=true;root.removeAttribute('data-intro');}
    if(st.introStart>=0){if((now-st.introStart)/1000>=INTRO_TIME+INTRO_STAGGER){st.introStart=-2;st.introDone=true;}else busy=true;}
    const paused=st.focused||(st.hovered&&cfg.hoverValue!==undefined),pausedSpeed=st.focused?0:(cfg.hoverValue??0);
    let target=st.reduced?0:paused?pausedSpeed*cfg.dirSign:cfg.speed*cfg.dirSign;
    if(!st.drag?.active){
      if(st.seek){st.seek.t=Math.min(1,st.seek.t+dt/st.seek.dur);st.offset=st.seek.from+st.seek.delta*easeInOut(st.seek.t);st.velocity=0;if(st.seek.t>=1)st.seek=null;busy=true;}
      else if(st.move){st.move.t=Math.min(1,st.move.t+dt/st.move.dur);st.offset=st.move.from+st.move.delta*easeInOut(st.move.t);st.velocity=0;busy=true;if(st.move.t>=1)st.move=null;}
      else{const tau=st.glide?GLIDE_TAU:SMOOTH_TAU;st.velocity+=(target-st.velocity)*(1-Math.exp(-dt/tau));if(Math.abs(st.velocity-target)<0.01)st.velocity=target;st.offset+=st.velocity*dt;if(st.velocity!==0||target!==0)busy=true;}
    }else busy=true;
    if(!st.focused&&!st.seek&&!st.drag?.active){const wrapped=((st.offset%st.period)+st.period)%st.period;if(st.move)st.move.from+=wrapped-st.offset;st.offset=wrapped;}
    const wantMag=cfg.magnify>0&&st.pointerInside&&!st.reduced?1:0;
    if(st.mag!==wantMag){st.mag+=(wantMag-st.mag)*(1-Math.exp(-dt/(wantMag?0.12:0.25)));if(Math.abs(wantMag-st.mag)<0.002)st.mag=wantMag;busy=true;}
    render(now);
    if(busy&&st.visible&&!st.destroyed)st.raf=requestAnimationFrame(frame);
  };

  const wake=()=>{if(st.raf||st.destroyed||!st.visible)return;st.last=0;st.raf=requestAnimationFrame(frame);};

  const local=e=>{const r=root.getBoundingClientRect(),k=root.offsetWidth?r.width/root.offsetWidth||1:1;return[(e.clientX-r.left)/k,(e.clientY-r.top)/k];};
  const onEnter=e=>{st.hovered=true;if(e.pointerType!=='touch'){st.pointerInside=true;st.pointer=local(e);}wake();};
  const onLeave=()=>{st.hovered=false;st.pointerInside=false;wake();};
  const onDown=e=>{st.pressedAt=performance.now();if(!config.current.draggable||(e.pointerType==='mouse'&&e.button!==0))return;const[x,y]=local(e);if(e.pointerType!=='touch')st.pointer=[x,y];st.drag={id:e.pointerId,x,y,active:false,samples:[],scale:1,anchor:0,offset:0};};
  const onMove=e=>{const cfg=config.current;if(e.pointerType!=='touch'){st.pointer=local(e);st.pointerInside=true;}const d=st.drag;if(d&&e.pointerId===d.id){const[x,y]=local(e);const along=cfg.vertical?y-d.y:x-d.x,across=cfg.vertical?x-d.x:y-d.y;if(!d.active){if(Math.abs(along)<DRAG_THRESHOLD)return wake();if(Math.abs(across)>Math.abs(along)){st.drag=null;return wake();}d.active=true;d.anchor=along;d.offset=st.offset;st.move=null;st.seek=null;st.glide=false;st.velocity=0;try{root.setPointerCapture(e.pointerId);}catch{}root.setAttribute('data-dragging','');}const next=d.offset-(along-d.anchor);const P=st.period||1;st.offset=((next%P)+P)%P;d.offset+=st.offset-next;const now=performance.now();d.samples.push([now,along]);while(d.samples.length>2&&now-d.samples[0][0]>100)d.samples.shift();}wake();};
  const endDrag=(e,cancelled)=>{const d=st.drag;if(!d||e.pointerId!==d.id)return;st.drag=null;if(!d.active)return;root.removeAttribute('data-dragging');try{root.releasePointerCapture(e.pointerId);}catch{}const now=performance.now();st.suppressUntil=now+400;let v=0;const s=d.samples;if(!cancelled&&s.length>1){const[t0,a0]=s[0],[t1,a1]=s[s.length-1];if(t1>t0&&now-t1<80)v=clamp((-(a1-a0)/(t1-t0))*1000,-MAX_FLING,MAX_FLING);}st.velocity=v;st.glide=Math.abs(v)>30;wake();};
  const onUp=e=>endDrag(e,false),onCancel=e=>endDrag(e,true);
  const onClick=e=>{if(performance.now()<st.suppressUntil){e.preventDefault();e.stopPropagation();st.suppressUntil=0;}};

  root.addEventListener('pointerenter',onEnter);root.addEventListener('pointerleave',onLeave);root.addEventListener('pointerdown',onDown);root.addEventListener('pointermove',onMove);root.addEventListener('pointerup',onUp);root.addEventListener('pointercancel',onCancel);root.addEventListener('lostpointercapture',onCancel);root.addEventListener('click',onClick,true);

  let resizeObserver=null;const observed=new Set();
  const refresh=()=>{collect();measure();if(resizeObserver){const first=track.children[0];for(const el of[root,first]){if(el&&!observed.has(el)){resizeObserver.observe(el);observed.add(el);}}}st.last=0;if(st.raf)cancelAnimationFrame(st.raf);st.raf=0;if(st.geo&&st.period>0)frame(performance.now());};

  if(typeof ResizeObserver!=='undefined')resizeObserver=new ResizeObserver(()=>{measure();if(st.geo&&st.period>0)render(performance.now());wake();});
  else window.addEventListener('resize',refresh);

  let intersection=null;
  if(typeof IntersectionObserver!=='undefined'){intersection=new IntersectionObserver(entries=>{const entry=entries[entries.length-1];st.visible=entry.isIntersecting;if(st.visible)wake();},{threshold:0.1});intersection.observe(root);}

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});

  return{refresh,wake,destroy(){st.destroyed=true;if(st.raf)cancelAnimationFrame(st.raf);root.removeEventListener('pointerenter',onEnter);root.removeEventListener('pointerleave',onLeave);root.removeEventListener('pointerdown',onDown);root.removeEventListener('pointermove',onMove);root.removeEventListener('pointerup',onUp);root.removeEventListener('pointercancel',onCancel);root.removeEventListener('lostpointercapture',onCancel);root.removeEventListener('click',onClick,true);resizeObserver?.disconnect();intersection?.disconnect();},state:st};
};

export const LogoLoop=memo(({logos,speed=120,direction='left',width='100%',logoHeight=28,gap=32,pauseOnHover,hoverSpeed,fadeOut=true,fadeOutWidth=0.12,scaleOnHover=false,layout='line',bend=0.5,focus=0,magnify=0,tiltX=0,tiltY=0,step=false,muted=0,labels='none',draggable=true,scrollBoost=0,intro=true,renderItem,ariaLabel='Partner logos',className,style})=>{
  const rootRef=useRef(null),trackRef=useRef(null),engineRef=useRef(null);
  const[{copies,primary},setLayout]=useState({copies:3,primary:1});
  const[introPending]=useState(intro);
  const vertical=direction==='up'||direction==='down';
  const config=useRef(null);
  config.current={speed,dirSign:(vertical?direction==='up':direction!=='right')?1:-1,hoverValue:hoverSpeed!==undefined?hoverSpeed:pauseOnHover===false?undefined:0,vertical,layout,bend,focus,magnify,tiltX,tiltY,step,draggable,scrollBoost,intro,scaleOnHover,labels,links:logos.some(item=>item.href)};

  useIsomorphicLayoutEffect(()=>{const engine=createEngine(rootRef.current,trackRef.current,config,setLayout);engineRef.current=engine;return()=>{engine.destroy();engineRef.current=null;};},[]);
  useIsomorphicLayoutEffect(()=>{engineRef.current?.refresh();},[copies,primary,logos,vertical,logoHeight,gap,labels,layout,bend,focus,magnify,tiltX,tiltY,scaleOnHover]);
  useEffect(()=>{engineRef.current?.wake();});

  const lists=useMemo(()=>Array.from({length:copies},(_,copyIndex)=>{
    const isPrimary=copyIndex===primary;
    return(<ul className="logoloop__list" key={copyIndex} role="list" aria-hidden={isPrimary?undefined:true}>{logos.map((item,itemIndex)=>{
      const key=`${copyIndex}-${itemIndex}`,isNode='node'in item;
      const visual=renderItem?renderItem(item,key):isNode?(<span className="logoloop__node" aria-hidden={!!item.href&&!item.ariaLabel}>{item.node}</span>):(<img src={item.src} srcSet={item.srcSet} sizes={item.sizes} width={item.width} height={item.height} alt={item.alt??''} title={item.title} loading="lazy" decoding="async" draggable={false}/>);
      const text=(labels==='inline'||labels==='below')&&item.title?item.title:null;
      const inner=<>{visual}{text&&<span className="logoloop__label" aria-hidden={!isNode&&!!item.alt}>{text}</span>}</>;
      const name=isNode?(item.ariaLabel??item.title):(item.alt??item.title);
      return(<li className="logoloop__item" key={key} role="listitem" data-color={item.hoverColor?'':undefined} style={item.hoverColor?{'--logoloop-item-color':item.hoverColor}:undefined}>
        {item.href?(<a className="logoloop__content" href={item.href} aria-label={name||'logo link'} target="_blank" rel="noreferrer noopener" draggable={false} tabIndex={isPrimary?undefined:-1}>{inner}</a>):(<div className="logoloop__content">{inner}</div>)}
        {labels==='hover'&&item.title&&<span className="logoloop__tip" aria-hidden="true">{item.title}</span>}
      </li>);
    })}</ul>);
  }),[copies,primary,logos,renderItem,labels]);

  const mask=fadeOut?fadeMask(fadeOutWidth,vertical):undefined;
  const amount=clamp(muted,0,1);
  const containerStyle={width:vertical?toCssLength(width)==='100%'?undefined:toCssLength(width):(toCssLength(width)??'100%'),'--logoloop-gap':`${gap}px`,'--logoloop-logoHeight':`${logoHeight}px`,...(amount>0&&{'--logoloop-gray':Math.min(1,amount*2).toFixed(3),'--logoloop-dim':(1-amount*0.6).toFixed(3)}),...(mask&&{WebkitMaskImage:mask,maskImage:mask}),...style};
  const rootClassName=['logoloop',vertical?'logoloop--vertical':'logoloop--horizontal',scaleOnHover&&'logoloop--scale-hover',className].filter(Boolean).join(' ');

  return(<div ref={rootRef} className={rootClassName} style={containerStyle} role="region" aria-label={ariaLabel} data-intro={introPending?'':undefined} data-draggable={draggable?'':undefined}><div className="logoloop__track" ref={trackRef}>{lists}</div></div>);
});
LogoLoop.displayName='LogoLoop';
export default LogoLoop;
