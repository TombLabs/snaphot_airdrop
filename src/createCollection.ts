import { TokenStandard, createNft, mintV1, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, generateSigner, keypairIdentity, percentAmount } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import bs58 from 'bs58';
import fs from 'fs';
require('dotenv').config()


const RPC = process.env.RPC_URL!;
let tree
if (fs.existsSync('./src/lib/merkleTree.json')) {
    tree = JSON.parse(fs.readFileSync('./src/lib/merkleTree.json', 'utf8'))
}

const uri = "uri to the collection's metadata"
const umi = createUmi(RPC)
const key = umi.eddsa.createKeypairFromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))
umi.use(keypairIdentity(key)).use(mplTokenMetadata())

async function main() {

    const mint = generateSigner(umi)
    try {
        const mintBuilder = await createNft(umi, {
            mint: mint.publicKey,
            name: 'Name of Collection NFT',
            symbol: 'SYMBOL',
            sellerFeeBasisPoints: percentAmount(5),
            uri: uri,
            isCollection: true,
        }).sendAndConfirm(umi)

        console.log('Collection NFT created')

        const info = {
            mint: mint.publicKey,
            tx: `https://solscan.io/tx/${bs58.encode(mintBuilder.signature)}`,
        }
        fs.writeFileSync('./src/lib/collectionMint.json', JSON.stringify(info, null, 2))
    } catch (e) {
        console.log(e)
        return
    }
}
main()

