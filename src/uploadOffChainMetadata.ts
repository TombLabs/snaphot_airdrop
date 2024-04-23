
import { GenericFile, createGenericFile, generateSigner, keypairIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';
import bs58 from 'bs58';
import fs from 'fs';
require('dotenv').config()

const RPC = process.env.RPC_URL!;

const umi = createUmi(RPC)
const key = umi.eddsa.createKeypairFromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))
umi.use(keypairIdentity(key)).use(nftStorageUploader({ token: process.env.NFT_STORAGE_TOKEN! }))

async function main() {
    const imageBuffer = fs.readFileSync('./path/to/image.jpg')
    const image = createGenericFile(imageBuffer, 'image.jpg')

    const [imageUri] = await umi.uploader.upload([image])
    console.log('Image uploaded')

    const uri = await umi.uploader.uploadJson({
        name: 'Name of Collection NFT',
        symbol: 'SYMBOL',
        seller_fee_basis_points: 500,
        description: 'Description of Collection NFT',
        image: imageUri,
        attributes: [
            {
                "trait_type": "Background",
                "value": "Red"
            }
        ],
        properties: {
            files: [
                {
                    uri: imageUri,
                    type: 'image/jpg'
                }
            ],
            creators: [
                {
                    address: 'creator address',
                    share: 100
                }
            ],
            category: 'image',
        }
    })

    console.log('Collection metadata uploaded')
    const info = {
        imageUri: imageUri,
        metadataUri: uri
    }
    fs.writeFileSync('./src/lib/collectionMetadata.json', JSON.stringify(info, null, 2))

}
main()