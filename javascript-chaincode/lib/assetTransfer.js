const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                DealerID: "D1",
                MSISDN: "123456789",
                MPIN: "0000",
                BALANCE: 1000,
                STATUS: "Active",
                TRANSAMOUNT: 0,
                TRANSTYPE: "",
                REMARKS: "Initial asset",
            },
            {
                DealerID: "D2",
                MSISDN: "987654321",
                MPIN: "1111",
                BALANCE: 1500,
                STATUS: "Active",
                TRANSAMOUNT: 0,
                TRANSTYPE: "",
                REMARKS: "Initial asset",
            },
            // Add more assets as needed
        ];

        for (const asset of assets) {
            await ctx.stub.putState(asset.MSISDN, Buffer.from(JSON.stringify(asset)));
        }
    }

    async CreateAsset(ctx, dealerId, msisdn, mpin, balance, status, transAmount, transType, remarks) {
        const asset = {
            DealerID: dealerId,
            MSISDN: msisdn,
            MPIN: mpin,
            BALANCE: balance,
            STATUS: status,
            TRANSAMOUNT: transAmount,
            TRANSTYPE: transType,
            REMARKS: remarks,
        };

        await ctx.stub.putState(msisdn, Buffer.from(JSON.stringify(asset)));
    }

    async UpdateAsset(ctx, msisdn, newBalance, newStatus) {
        const assetBytes = await ctx.stub.getState(msisdn);
        if (!assetBytes || assetBytes.length === 0) {
            throw new Error(`Asset with MSISDN ${msisdn} does not exist`);
        }

        const asset = JSON.parse(assetBytes.toString());
        asset.BALANCE = newBalance;
        asset.STATUS = newStatus;

        await ctx.stub.putState(msisdn, Buffer.from(JSON.stringify(asset)));
    }

    async QueryAsset(ctx, msisdn) {
        const assetBytes = await ctx.stub.getState(msisdn);
        if (!assetBytes || assetBytes.length === 0) {
            throw new Error(`Asset with MSISDN ${msisdn} does not exist`);
        }

        return assetBytes.toString();
    }

    async GetAssetHistory(ctx, msisdn) {
        const resultsIterator = await ctx.stub.getHistoryForKey(msisdn);
        const assetHistory = [];

        while (true) {
            const result = await resultsIterator.next();

            if (result.value && result.value.value.toString()) {
                const record = JSON.parse(result.value.value.toString('utf8'));
                assetHistory.push(record);
            }

            if (result.done) {
                await resultsIterator.close();
                return JSON.stringify(assetHistory);
            }
        }
    }
}

module.exports = AssetTransfer;