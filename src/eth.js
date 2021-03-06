const bitcore = require("bitcore-lib");
const ethWallet = require("ethereumjs-wallet");
const ethTx = require("ethereumjs-tx");
const BigNumber = require("bignumber.js");
const Web3 = require("web3");

const seed = process.env.SEED || "abcde12345";

// initialize faucet wallet
const seedValue = Buffer.from(seed);
const hash = bitcore.crypto.Hash.sha256(seedValue);
const ethPK = ethWallet.fromPrivateKey(hash);
const faucetETHAddress = ethPK.getAddressString();

// initalize web3
const CHAIN_RPC_URL =
  process.env.ETH_RPC_URL ||
  "https://eth-rinkeby.alchemyapi.io/jsonrpc/zZ-27qEFmD4HN6sNUyc3uAyT8Dtv_JCU";
const web3 = new Web3(new Web3.providers.HttpProvider(CHAIN_RPC_URL));

const factor = new BigNumber(10).exponentiatedBy(18); // decimal for eth

module.exports.sendTx = async (amount, destination) => {
  try {
    const value = new BigNumber(amount).multipliedBy(factor);
    const nonce = await web3.eth.getTransactionCount(faucetETHAddress);
    const gasLimit = new BigNumber(200000);

    const txParams = {
      nonce: `0x${nonce.toString(16)}`,
      gasPrice: `0xBA43B7400`,
      gasLimit: `0x${gasLimit.toString(16)}`,
      to: destination,
      value: `0x${value.toString(16)}`,
      data: `0x0`
      //  chainId: 4
    };

    const tx = new ethTx(txParams);
    tx.sign(hash);

    console.log('signed tx:', tx);
  
    const serializedTx = tx.serialize().toString("hex");

    const sendEth = async serializedTx => {
      return new Promise(function(resolve, reject) {
        web3.eth
          .sendSignedTransaction("0x" + serializedTx)
          .once("transactionHash", (e) => {
            resolve(e); // done
          });
      });
    };

    return await sendEth(serializedTx);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

module.exports.address = faucetETHAddress;

module.exports.getBalance = async address => {
  const result = await web3.eth.getBalance(address);
  return result / factor;
};
