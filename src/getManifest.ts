import axios from 'axios';
import fs from 'fs';
require('dotenv').config();

async function getHashlistAndHolderMap() {
    const url = process.env.RPC_URL!;

    let page: number | boolean = 1
    let assets = []
    let holderMap = []

    while (page) {
        const response = await axios.post(url, JSON.stringify({
            jsonrpc: "2.0",
            method: "getAssetsByGroup",
            id: 1,
            params: {
                groupKey: 'collection',
                groupValue: 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w',
                page: page,
                limit: 1000,
            },
        }))
        const results = response.data.result
        assets.push(...results.items.map((item: any) => item.assetId))
        holderMap.push(...results.items.map((item: any) => {
            return {
                assetId: item.assetId,
                nftName: item.content?.metadata?.name,
                holder: item.ownership.owner
            }
        }))

        if (results.total !== 1000) {
            page = false
        } else {
            page++
        }
    }
    fs.writeFileSync('./src/lib/hashlist.json', JSON.stringify(assets), 'utf8');
    fs.writeFileSync('./src/lib/holderMap.json', JSON.stringify(holderMap), 'utf8');
    console.log('Hashlist and Holdermap updated')
}
getHashlistAndHolderMap();

