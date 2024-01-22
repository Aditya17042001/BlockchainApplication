const express = require('express');
const bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const {
  buildCAClient,
  registerAndEnrollUser,
  enrollAdmin,
} = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const ccp = buildCCPOrg1();
const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'javascriptAppUser';

async function connectToGateway() {
  const wallet = await buildWallet(Wallets, walletPath);

  await enrollAdmin(caClient, wallet, 'Org1MSP');
  await registerAndEnrollUser(caClient, wallet, 'Org1MSP', org1UserId, 'org1.department1');

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: org1UserId,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork('mychannel');
  return network.getContract('basic');
}

app.post('/createAsset', async (req, res) => {
  try {
    const contract = await connectToGateway();
    const result = await contract.submitTransaction(
      'CreateAsset',
      req.body.dealerId,
      req.body.msisdn,
      req.body.mpin,
      req.body.balance,
      req.body.status,
      req.body.transAmount,
      req.body.transType,
      req.body.remarks
    );
    res.json({ result: result.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/readAsset/:assetId', async (req, res) => {
  try {
    const contract = await connectToGateway();
    const result = await contract.evaluateTransaction('GetAssetHistory', req.params.assetId);
    res.json({ result: result.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/initLedger', async (req, res) => {
  try {
    const contract = await connectToGateway();
    const result = await contract.submitTransaction('InitLedger');
    res.json({ result: result.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/updateAsset/:msisdn', async (req, res) => {
  try {
    const { newBalance, newStatus } = req.body;
    const contract = await connectToGateway();
    const result = await contract.submitTransaction('UpdateAsset', req.params.msisdn, newBalance, newStatus);
    res.json({ result: result.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queryAsset/:msisdn', async (req, res) => {
  try {
    const contract = await connectToGateway();
    const result = await contract.evaluateTransaction('QueryAsset', req.params.msisdn);
    res.json({ result: result.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/getAssetHistory/:msisdn', async (req, res) => {
  try {
    const contract = await connectToGateway();
    const result = await contract.evaluateTransaction('GetAssetHistory', req.params.msisdn);
    res.json({ result: result.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});