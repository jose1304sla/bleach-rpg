export async function request(path:string,body?:unknown){
 const res=await fetch('/api/'+path,{credentials:'same-origin',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const data=await res.json();if(!res.ok)throw Error(data.error||'Não foi possível concluir a ação.');return data;
}
