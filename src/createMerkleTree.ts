import { createTree, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import bs58 from 'bs58';
import fs from 'fs';
require('dotenv').config()

const RPC = process.env.RPC_URL!;

const umi = createUmi(RPC)
const key = umi.eddsa.createKeypairFromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))
umi.use(keypairIdentity(key)).use(mplBubblegum())

async function main() {

    const merkleTree = generateSigner(umi)
    try {
        const builder = await createTree(umi, {
            merkleTree,
            maxDepth: 14,
            maxBufferSize: 64,
        })
        await builder.sendAndConfirm(umi)
        console.log('Merkle tree created')

    } catch (e) {
        console.log(e)
        return
    }

    const info = {
        merkleTree: merkleTree.publicKey,
        merkleTreeSigner: bs58.encode(merkleTree.secretKey),
    }
    fs.writeFileSync('./src/lib/merkleTree.json', JSON.stringify(info, null, 2))

}
main()

