/*build into one html file. all linked js/ts scripts are set to <script> tags.
bun run build.js; bun run dev
*/
Bun.build({
    entrypoints: ["client/src/game.ts"],//, "client/src/game.html"], 
    outdir: 'client/build/',
});

Bun.build({
    entrypoints: ["client/src/index.html"],//, "client/src/game.html"], 
    target: 'browser',
    compile: true,   
    outdir: 'client/build/',
    //minify: true,
});

console.log("build complete")
//await Bun.write(Bun.stdout, Bun.file("client/src/textures/boat.png"))

