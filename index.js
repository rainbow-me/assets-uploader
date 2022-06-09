const cloudinary = require('cloudinary').v2
const yargs = require('yargs/yargs')
const fs = require("fs")
const fetch = require("node-fetch")
const { hideBin } = require('yargs/helpers')
const { execSync } = require('child_process');

const link  = (code, chain) => `https://rainbowme-res.cloudinary.com/image/upload/assets/${chain}/${code}.png`

const argv = yargs(hideBin(process.argv)).argv

const apiKey = argv.key
const apiSecret = argv.secret
const forceUpload = argv.force

cloudinary.config({
  cloud_name: 'rainbowme',
  api_key: apiKey,
  api_secret: apiSecret
});

const chains = ["arbitrum", "polygon", "optimism", "ethereum"]


const blockchainsFolder = argv.dir + "/blockchains/"

const recentCommits = JSON.parse(fs.readFileSync("./lastCommits.json", "utf-8"))

let i = 0
const logos = []

const commitHash = execSync(`git -C ./../assets log -n 1 --pretty=format:%H -- blockchains/ethereum/assets/0x0cd022dde27169b20895e0e2b2b8a33b25e63579/logo.png | cat`, { encoding : 'utf8' })

console.log(commitHash === "", undefined)
for (let chain of chains) {
    const assetCodes = fs.readdirSync(blockchainsFolder + chain + "/assets");
    for (let code of assetCodes) {
        console.log(`Analysing... ${chain}/${code}`)
        const logo = blockchainsFolder + chain + "/assets/" + code + "/logo.png"
        const commitHash = execSync(`git -C ${argv.dir} log -n 1 --pretty=format:%H -- blockchains/${chain}/assets/${code}/logo.png | cat`, { encoding : 'utf8' })
        if (commitHash !== "" && (forceUpload || commitHash !== recentCommits[code.toLowerCase()])) {
            recentCommits[code.toLowerCase()] = commitHash.toLowerCase()
            logos.push([chain, code, logo])
        } else {
            console.log("Skipped.")
        }
    }
}

async function uploadImages() {
    let current = 0;
    const total = logos.length
    let startTime = Date.now()
    console.log(`--------- UPLOADING ${total} asset(s). ---------`)
    for (let [chain, code, logo] of logos) {
        console.log(`Uploading... ${chain}/${code} (${current++}/${total})`)
        if (current % 10 === 0) {
            const remainingMs = ((Date.now() - startTime) * (total - current) / current)
            const remainingMinutes = remainingMs / 1000 / 60
            console.log("Left in munites: " + remainingMinutes)
        }
        try {
            // const cloudinaryLink = link(code, chain)
            // if (!forceUpload) {
            //     const res = await fetch(cloudinaryLink)
            //     if (res.status === 200) {
            //         console.log("Skipped.")
            //         continue;
            //     }
            // }
            const res = await cloudinary.uploader.upload(logo, { public_id: "assets/" + chain + "/" + code })
            console.log("Done.")
        } catch (e) {
            console.log(e)
        }
    }

}

uploadImages()