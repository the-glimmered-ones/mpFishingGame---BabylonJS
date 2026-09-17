/*build into one html file. all linked js/ts scripts are set to <script> tags.
bun run build.js; bun run dev
*/
import { mkdir } from "node:fs";
import { readdir } from "node:fs/promises";

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

const startFolder = "client/src/textures/"
const endFolder = "client/build/textures/"
await mkdir(endFolder, buildPaths)

async function buildPaths() {
    const resourcesFT = await readdir(startFolder, {withFileTypes: true})
    const resources = await readdir(startFolder, {withFileTypes: false})

    for (let i = resources.length-1; i >= 0; i--){
        var startName = startFolder + resources[i]
        var endName = endFolder + resources[i]

        if ((resourcesFT[i].isDirectory())){
            const startSubfolder = startFolder + resources[i]
            const endSubfolder = endFolder + resources[i]
            await mkdir(endSubfolder, async function () {
                const subfolderResFT = await readdir(startSubfolder, {withFileTypes: true})
                const subfolderRes = await readdir(startSubfolder, {withFileTypes: false})

                for (let i = subfolderResFT.length-1; i >= 0; i--){
                var subStartName = startSubfolder + "/" + subfolderRes[i]
                var subEndName = endSubfolder + "/" + subfolderRes[i]
                //console.log(subEndName)//subfolderResFT[i]

                await Bun.write(subEndName, Bun.file(subStartName))
            }})
        }
        else{
            await Bun.write(endName, Bun.file(startName))
        }
    }
}
console.log("build complete")
//await Bun.write(Bun.stdout, Bun.file("client/src/textures/boat.png"))

