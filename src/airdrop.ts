
import { mintV1, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { setComputeUnitPrice } from "@metaplex-foundation/mpl-toolbox";
import { generateSigner, keypairIdentity, publicKey, sol, some } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import bs58 from "bs58";
import fs from "fs";
require("dotenv").config();


const RPC = process.env.RPC!

const umi = createUmi(RPC)

const keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(process.env.NEW_ROYALTY_KEY!))

umi.use(keypairIdentity(keypair)).use(mplBubblegum())

const merkleTree = JSON.parse(fs.readFileSync('./src/lib/merkleTree.json', 'utf8'))
const collection = JSON.parse(fs.readFileSync('./src/lib/collectionMint.json', 'utf8'))

//Use this on the first run
const manifest = JSON.parse(fs.readFileSync('./src/lib/manifest', 'utf8'))

//manifest will be an array with  the following structure
/*
{
    recipient: string,
    uri: string,
    madNumber: string,
    completed?: boolean
}
*/
type ManifestItem = {
    recipient: string,
    uri: string,
    madNumber: string,
    completed?: boolean
}

//Use this on subsequent runs
/* const manifest = JSON.parse(fs.readFileSync('./src/lib/errors.json', 'utf8')) */



//chunk up the array to avoid overloading rpc rate limits
const chunkSize = 50

const chunks: ManifestItem[][] = []

for (let i = 0; i < manifest.length; i += chunkSize) {
    chunks.push(manifest.slice(i, i + chunkSize))
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
    console.log("remaining: ", manifest.length)

    let completed = []
    let errors = []

    for (const chunk of chunks) {
        //delay 10 seconds between each chunk
        await sleep(10000)
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`Sending chunk ${chunks.indexOf(chunk) + 1} of ${chunks.length}`)

        const results = await Promise.all(chunk.map(async (item) => {
            try {
                const uri = item.uri
                const recipient = publicKey(item.recipient)
                const mintTx = await mintV1(umi, {
                    leafOwner: recipient,
                    merkleTree: merkleTree.merkleTree,
                    metadata: {
                        name: `Collection name #${item.madNumber}`,
                        uri: uri,
                        collection: some({
                            key: collection.mint,
                            verified: false
                        }),
                        creators: [
                            {
                                address: publicKey("whatever they want"),
                                share: 100,
                                verified: false
                            }
                        ],
                        sellerFeeBasisPoints: 500,
                        symbol: "SYMBOL",

                    }
                }).add(
                    setComputeUnitPrice(umi, {
                        microLamports: 10000
                    })
                ).sendAndConfirm(umi)

                return {
                    ...item,
                    completed: true
                }
            } catch (e) {
                return {
                    ...item,
                    completed: false,

                }
            }
        }
        ))
        completed.push(...results.filter((item) => item.completed))
        errors.push(...results.filter((item) => !item.completed))
    }

    fs.writeFileSync('./src/lib/error.json', JSON.stringify(errors, null, 2));
    fs.writeFileSync(`./src/lib/completions${Date.now()}.json`, JSON.stringify(completed, null, 2));
    console.log("Completed", completed.length)
    console.log("Errors", errors.length)
    console.log("Operating at a success rate of ", completed.length / manifest.length * 100, "%")
    console.log("Done")
}
main()

