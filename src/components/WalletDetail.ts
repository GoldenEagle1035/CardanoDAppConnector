import { css } from 'lit';
import { html, useState, useEffect } from 'haunted';
import { useStyles } from '../hooks/useStyles';

import {
  Address,
  BaseAddress,
  MultiAsset,
  Assets,
  ScriptHash,
  Costmdls,
  Language,
  CostModel,
  AssetName,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionOutput,
  Value,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionOutputBuilder,
  LinearFee,
  BigNum,
  BigInt,
  TransactionHash,
  TransactionInputs,
  TransactionInput,
  TransactionWitnessSet,
  Transaction,
  PlutusData,
  PlutusScripts,
  PlutusScript,
  PlutusList,
  Redeemers,
  Redeemer,
  RedeemerTag,
  Ed25519KeyHashes,
  ConstrPlutusData,
  ExUnits,
  Int,
  NetworkInfo,
  EnterpriseAddress,
  TransactionOutputs,
  hash_transaction,
  hash_script_data,
  hash_plutus_data,
  ScriptDataHash,
  Ed25519KeyHash,
  NativeScript,
  StakeCredential,
  StakeRegistration,
} from '@emurgo/cardano-serialization-lib-asmjs';

const fromHexStringToBytes = (hexString: any) => {
  const data = new Uint8Array(
    hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16))
  );
  return data;
};

const fromBytesToHexString = (bytes: any) => {
  bytes.reduce(
    (str: any, byte: any) => str + byte.toString(16).padStart(2, '0'),
    ''
  );
};

const utf8ToHex = (utf8String: string) => {
  const data = utf8String
    .split('')
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');

  return data;
};

const cardanoMult = 1000000;

function WalletDetail(
  this: any,
  { API, name, icon }: { API: any; name: string; icon: string }
) {
  useStyles(this, [css``]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [utxos, setUtxos] = useState();
  const [collateral, setCollateral] = useState([]);
  /**
   * Gets the UTXOs from the user's wallet and then
   * stores in an object in the state
   * @returns {Promise<void>}
   */

  const getUtxos = async () => {
    const _Utxos: any[] = [];

    try {
      const rawUtxos = await API.getUtxos();

      for (const rawUtxo of rawUtxos) {
        const utxo = TransactionUnspentOutput.from_bytes(
          fromHexStringToBytes(rawUtxo)
        );
        const input = utxo.input();
        const utf8Decoder = new TextDecoder('utf-8');

        const txid = utf8ToHex(
          utf8Decoder.decode(input.transaction_id().to_bytes())
        );
        const txindx = input.index();
        const output = utxo.output();

        const amount = output.amount().coin().to_str(); // ADA amount in lovelace

        const multiasset = output.amount().multiasset();
        let multiAssetStr = '';

        if (multiasset) {
          const keys = multiasset.keys(); // policy Ids of thee multiasset
          const N = keys.len();
          // console.log(`${N} Multiassets in the UTXO`)

          for (let i = 0; i < N; i += 1) {
            const policyId = keys.get(i);
            const policyIdHex = utf8ToHex(
              utf8Decoder.decode(policyId.to_bytes())
            );
            // console.log(`policyId: ${policyIdHex}`)
            const assets = multiasset.get(policyId);
            const assetNames = assets?.keys();
            if (assetNames) {
              const K = assetNames.len();
              // console.log(`${K} Assets in the Multiasset`)

              for (let j = 0; j < K; j += 1) {
                const assetName = assetNames.get(j);
                const assetNameString = utf8Decoder.decode(assetName.name());
                const assetNameHex = utf8ToHex(
                  utf8Decoder.decode(assetName.name())
                );
                const multiassetAmt = multiasset.get_asset(policyId, assetName);
                multiAssetStr += `+ ${multiassetAmt.to_str()} + ${policyIdHex}.${assetNameHex} (${assetNameString})`;
                // console.log(assetNameString)
                // console.log(`Asset Name: ${assetNameHex}`)
              }
            }
          }
        }

        _Utxos.push({
          txid: txid,
          txindx: txindx,
          amount: amount,
          str: `${txid} #${txindx} = ${amount}`,
          multiAssetStr: multiAssetStr,
          TransactionUnspentOutput: utxo,
        });

        // console.log(multiAssetStr
        //   .split('+')
        //   .filter(i => !Number(i))
        //   .reduce((acc: object, i) => {
        //     let [policy, name] : [policy: String, name: String] = i.split('.');

        //     policy = policy.trim();

        //     if (Object.keys(acc).includes(policy)) {
        //       acc[policy].push(name);
        //     } else {
        //       acc[policy] = [name];
        //     }

        //     return acc;
        //   }, {}));
      }
    } catch (err) {
      console.log(err);
    }

    return _Utxos;
  };

  /**
   * The collateral is need for working with Plutus Scripts
   * Essentially you need to provide collateral to pay for fees if the
   * script execution fails after the script has been validated...
   * this should be an uncommon occurrence and would suggest the smart contract
   * would have been incorrectly written.
   * The amount of collateral to use is set in the wallet
   * @returns {Promise<void>}
   */
  const getCollateral = async () => {
    const CollatUtxos: any[] = [];

    try {
      let apiCollateral = [];

      apiCollateral = await API.getCollateral();

      for (const x of apiCollateral) {
        const utxo = TransactionUnspentOutput.from_bytes(
          fromHexStringToBytes(x)
        );
        CollatUtxos.push(utxo);
      }
    } catch (err) {
      console.log(err);
    }

    return CollatUtxos;
  };

  /**
   * Get the address from the wallet into which any spare UTXO should be sent
   * as change when building transactions.
   * @returns {Promise<void>}
   */
  const getChangeAddress = async () => {
    let changeAddress = null;

    try {
      const raw = await API.getChangeAddress();
      changeAddress = Address.from_bytes(fromHexStringToBytes(raw)).to_bech32();
    } catch (err) {
      console.log(err);
    }

    return changeAddress;
  };

  /**
   * This is the Staking address into which rewards from staking get paid into
   * @returns {Promise<void>}
   */
  const getRewardAddresses = async () => {
    let rewardAddress = null;
    try {
      const raw = await API.getRewardAddresses();
      const rawFirst = raw[0];
      rewardAddress = Address.from_bytes(
        fromHexStringToBytes(rawFirst)
      ).to_bech32();
      // console.log(rewardAddress)
    } catch (err) {
      console.log(err);
    }

    return rewardAddress;
  };

  /**
   * Every transaction starts with initializing the
   * TransactionBuilder and setting the protocol parameters
   * This is boilerplate
   * @returns {Promise<TransactionBuilder>}
   */
  const initTransactionBuilder = async () => {
    const txBuilder = TransactionBuilder.new(
      TransactionBuilderConfigBuilder.new()
        .fee_algo(
          LinearFee.new(
            BigNum.from_str(this.protocolParams.linearFee.minFeeA),
            BigNum.from_str(this.protocolParams.linearFee.minFeeB)
          )
        )
        .pool_deposit(BigNum.from_str(this.protocolParams.poolDeposit))
        .key_deposit(BigNum.from_str(this.protocolParams.keyDeposit))
        .coins_per_utxo_word(
          BigNum.from_str(this.protocolParams.coinsPerUtxoWord)
        )
        .max_value_size(this.protocolParams.maxValSize)
        .max_tx_size(this.protocolParams.maxTxSize)
        .prefer_pure_change(true)
        .build()
    );

    return txBuilder;
  };

  /**
   * Gets the current balance of in Lovelace in the user's wallet
   * This doesnt resturn the amounts of all other Tokens
   * For other tokens you need to look into the full UTXO list
   * @returns {Promise<void>}
   */
  const getBalance = async () => {
    let balance: number = 0;
    try {
      const balanceCBORHex = await API.getBalance();
      balance = Number(
        Value.from_bytes(fromHexStringToBytes(balanceCBORHex)).coin().to_str()
      );
    } catch (err) {
      console.log(err);
    }
    setWalletBalance(balance);
  };

  const disconnect = (wallet: string) => {
    const event = new CustomEvent('disconnect', {
      bubbles: true,
      composed: true,
      detail: { wallet },
    });

    this.dispatchEvent(event);
  };

  const removeWallet = () => {
    disconnect(API);
  };

  useEffect(async () => {
    await getBalance();
    const _utxos = await getUtxos();
    setUtxos(_utxos);

    if (API) {
      await getCollateral();
    }
  }, [API]);

  return html` <sl-card --sl-font-sans style="width: 100%">
    <div class="row">
      <div class="col-12" style="display:flex">
        <img style="float: left" width="60px" src=${icon} alt="flint icon" />
        <h1 style="display:inline; margin-left:1rem;">${name}</h1>
      </div>
    </div>

    <div class="row" style="margin-top: 1rem">
      <div class="col-12">
        <p><strong>Balance:</strong> ${walletBalance / cardanoMult}</p>
        ${utxos && (<any[]>utxos).length > 0
          ? (<any[]>utxos).map(
              (i: any) =>
                html`<p>
                  ${i.txid.slice(0, 20)}... + ${Number(i.amount) / cardanoMult}
                </p>`
            )
          : null}
      </div>
    </div>

    <div slot="footer">
      <sl-button
        style="width:100%"
        slot="footer"
        variant="primary"
        outline
        @click=${removeWallet}
        >Remove wallet</sl-button
      >
    </div>
  </sl-card>`;
}

export { WalletDetail };
