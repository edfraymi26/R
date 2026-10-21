import test from 'node:test';import assert from 'node:assert/strict';
import {validateReviews,reviewsPage} from '../src/reviews.mjs';
const fixture={id:'synthetic-test-only',name:'Test fixture',service:'formation',rating:1,text:'Synthetic test content; this is not a customer review.',date:'2026-01-01',language:'en',consent:true,confirmed:true};
test('reviews require consent and a confirmed service experience',()=>{
 for(const change of [{consent:false},{confirmed:false},{rating:0},{rating:6},{rating:1.5},{date:'2026-02-30'},{service:'mortgage'}])assert.throws(()=>validateReviews([{...fixture,...change}]));
});
test('private submission fields and sensitive public text cannot enter published data',()=>{
 assert.throws(()=>validateReviews([{...fixture,email:'private@example.com'}]));assert.throws(()=>validateReviews([{...fixture,text:'Please publish my email private@example.com here'}]));assert.throws(()=>validateReviews([{...fixture,text:'My SSN is 123-45-6789, please use this information.'}]));
});
test('negative and positive reviews are retained and sorted by date, not rating',()=>{
 const result=validateReviews([{...fixture,id:'positive',rating:5,date:'2025-01-01'},fixture]);assert.equal(result.length,2);assert.equal(result[0].rating,1);
});
test('published review text is escaped and original language is marked',()=>{
 const html=reviewsPage('es',[{...fixture,text:'Synthetic test <img src=x onerror=alert(1)> content.'}]);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('lang="en"'));
});
test('empty page has no fake reviews or ratings and bilingual native Netlify forms',()=>{
 for(const l of ['es','en']){const html=reviewsPage(l,[]);assert.ok(!html.includes('class="review-card"'));assert.ok(html.includes(`name="client-reviews-${l}"`));assert.ok(html.includes('data-netlify="true"'));assert.ok(html.includes('netlify-honeypot="bot-field"'));assert.ok(html.includes('name="consent" value="accepted" required'));}
});
