// Four transparent photographic parts, reassembled around real attachment points.
// The base is a sibling of the beam: it cannot rotate with the moving assembly.
const sheet='/assets/scale-parts.webp';
const part=(box,x,y,width,height)=>`<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${box}" overflow="hidden"><image href="${sheet}" width="1536" height="1024"/></svg>`;
export function scale({animated=false}={}){
 return `<svg class="scale-symbol" ${animated?'data-scale-animate':''} viewBox="0 0 1100 780" aria-hidden="true" focusable="false">
 <g data-scale-base>${part('240 18 320 488',334,34,432,659)}</g>
 <g data-scale-beam>
 ${part('755 170 755 145',173,114,755,145)}
 <g transform="translate(200 231)"><g data-scale-pan="left">${part('140 566 495 440',-198,-10,396,352)}</g></g>
 <g transform="translate(898 231)"><g data-scale-pan="right">${part('878 566 516 440',-209,-10,413,352)}</g></g>
 </g></svg>`;
}
