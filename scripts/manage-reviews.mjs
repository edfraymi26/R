// Admin-only local helper. Never copy a raw Netlify submission into public assets.
import {readFile,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {randomUUID} from 'node:crypto';
import {validateReviews} from '../src/reviews.mjs';
const file=new URL('../src/reviews.json',import.meta.url),[action,value]=process.argv.slice(2);
const current=JSON.parse(await readFile(file,'utf8'));
let next;
if(action==='--new'){
 const prompt=createInterface({input:process.stdin,output:process.stdout});
 try{
  const name=await prompt.question('Nombre público autorizado: ');
  const service=await prompt.question('ID del servicio (ver docs/RESENAS.md): ');
  const rating=Number(await prompt.question('Calificación original (1–5): '));
  const text=await prompt.question('Comentario exacto autorizado (sin datos privados): ');
  const date=await prompt.question('Fecha del envío (AAAA-MM-DD): ');
  const language=await prompt.question('Idioma original (es/en): ');
  const confirmed=/^(s[ií]|yes)$/i.test((await prompt.question('¿Confirmaste una experiencia real con el servicio? (sí/no): ')).trim());
  const consent=/^(s[ií]|yes)$/i.test((await prompt.question('¿El autor autorizó publicar estos datos y este texto? (sí/no): ')).trim());
  next=validateReviews([...current,{id:'review-'+randomUUID(),name,service,rating,text,date,language,confirmed,consent}]);
 }finally{prompt.close();}
}else if(action==='--add'&&value){
 const item=JSON.parse(await readFile(value,'utf8'));next=validateReviews([...current,item]);
}else if(action==='--remove'&&value){
 if(!current.some(r=>r.id===value))throw Error('Review not found');next=validateReviews(current.filter(r=>r.id!==value));
}else{console.error('Usage: npm run reviews -- --new | --add /private/path/approved-review.json | --remove review-id');process.exit(1);}
await writeFile(file,JSON.stringify(next,null,2)+'\n');
console.log(`Saved ${next.length} approved reviews. Run npm run verify and deploy the complete project to publish the change.`);
