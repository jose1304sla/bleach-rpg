import type {Item,Catalog} from '../types';
export function Bar({value,max,color='red'}:{value:number;max:number;color?:string}){return <div className={'bar '+color}><i style={{width:Math.max(0,Math.min(100,value/max*100))+'%'}}/></div>}
export function Badge({item,c}:{item:Item|undefined;c:Catalog}){return item?<span className={'badge rarity-'+item.tier}>{c.RARITIES[item.tier]}</span>:<span className="badge">Não revelado</span>}
