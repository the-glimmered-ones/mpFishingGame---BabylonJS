/*build into one html file. all linked js/ts scripts are set to <script> tags.
bun run build.js; bun run dev
*/
import { read, mkdir } from "node:fs";
import { readdir } from "node:fs/promises";

import cluster from 'node:cluster'
import os from 'node:os'
import process from 'node:process'

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

//run server in parallel
if (cluster.isPrimary) {
  	for (let i = 0; i < os.availableParallelism(); i++)
    	cluster.fork()
} else {
  	await import('./server/src/index.ts')
  	console.log(`Worker ${process.pid} started`)
}


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

