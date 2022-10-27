import {log} from "@graphprotocol/graph-ts"
import { PairCreated} from "../generated/Uniswapv2/Uniswapv2";
import {Mint, Swap,Burn, Sync, Transfer} from "../generated/templates/Pair/Pair";
import {Pair as PairTemplate} from "../generated/templates"
import { LiquidityPool, _HelperStore, Token, _Transfer, Deposit } from "../generated/schema";
import { updateLiquidityPoolMetrics, updateProtocolMetrics, updateTokenWhitelists, updateTokenPrice, updateVolumeAndFees } from "./updateMetrics"
import { BIGINT_THOUSAND, BIGINT_ZERO } from "./constants";



import { CreateDexAmmProtocol, 
  getOrCreateToken, 
  getOrCreateLPToken, 
  CreateLiquidityPool, 
  getOrCreateSwap,
  getOrCreateDeposit, 
  getOrCreateWithdraw,
    getOrCreateFinancialsDailySnapshot,
    CreateLiquidityPoolFee,
  getLiquidityPool} from "./entites";
import { getTrackedVolumeUSD, updateNativeTokenPrice } from "./price/price";
import { BIGINT_FIVE_THOUSAND, FACTORY_ADDRESS } from "./constants";
import { ZERO_ADDRESS, ZERO_ADDRESS_STRING } from "./prices/common/constants";
import {handleTransferBurn, handleTransferMint, handleTransferToPoolBurn} from "./helper"




export function handlePairCreated(event: PairCreated): void {
  let pair = event.params.pair;
  let poolAddres = pair.toHexString()
  let protocol = CreateDexAmmProtocol()
  let token0 = getOrCreateToken(event.params.token0);
  let token1 = getOrCreateToken(event.params.token1);
  let LPtoken = getOrCreateLPToken(event.params.pair.toHexString(), token0, token1)
  let pool =CreateLiquidityPool(event,poolAddres, token0, token1, LPtoken);
  protocol.totalPoolCount += 1;
  protocol.save()
  updateTokenWhitelists(event.params.token0.toHexString(), event.params.token1.toHexString(), event.params.pair.toHexString())
  let _ = updateNativeTokenPrice()
  let __ = getOrCreateFinancialsDailySnapshot(event)
  CreateLiquidityPoolFee(poolAddres)
  PairTemplate.create(pair)
   
}


export function handleSwap(event:Swap):void {
  let pairAddress = event.address
  let swapEntity = getOrCreateSwap(event) 
  let pool = LiquidityPool.load(pairAddress.toHexString())
  let userAddress = event.params.sender.toHexString()
  let token0Amount = event.params.amount0Out.plus(event.params.amount0In)
  let token1Amount = event.params.amount1Out.plus(event.params.amount1In)
  let token0 = Token.load(pool!.inputTokens[0])!
  let token1 = Token.load(pool!.inputTokens[1])!
  let poolAddress = pairAddress.toHexString();
  let trackedAmountUSD = getTrackedVolumeUSD(poolAddress,token0Amount.toBigDecimal(),token0, token1Amount.toBigDecimal(), token1)
  updateVolumeAndFees(event, FACTORY_ADDRESS, poolAddress, trackedAmountUSD, token0Amount, token1Amount)
  updateTokenPrice(event)
  updateLiquidityPoolMetrics(event)
  updateProtocolMetrics(event, userAddress, 'SWAP')

}

export function handleMint(event:Mint):void {
  let depositEntity = getOrCreateDeposit(event)
  let userAddress = event.params.sender.toHexString()
  let poolDeposits = _HelperStore.load(event.address.toHexString())
  poolDeposits!.valueInt = poolDeposits!.valueInt + 1
  poolDeposits!.save()
  updateTokenPrice(event)
  updateLiquidityPoolMetrics(event)
  updateProtocolMetrics(event, userAddress, 'DESPOSIT')

}

export function handleBurn(event:Burn):void {
  let withdrawEntity = getOrCreateWithdraw(event)
  let userAddress = event.params.sender.toHexString()
  updateTokenPrice(event)
  updateLiquidityPoolMetrics(event)
  updateProtocolMetrics(event, userAddress, 'WITHDRAW')
}

export function handleTransfer(event:Transfer):void  {
    let pool = getLiquidityPool(event.address.toHexString());
    if(event.params.to.toHexString() == ZERO_ADDRESS_STRING &&
        event.params.value.equals(BIGINT_THOUSAND)&&
        pool.outputTokenSupply == BIGINT_ZERO){
            return
        }

    if(event.params.from.toHexString()==ZERO_ADDRESS_STRING){
        handleTransferMint(
            event,
            pool,
            event.params.value,
            event.params.to.toHexString()
        )
    }

    if(event.params.to == event.address){
        
    }



    let hash = event.transaction.hash.toHexString()
    let logIndex = event.transactionLogIndex.toI32()
    let id = 'deposit' + hash.concat('-').concat(logIndex.toString())
    // let pool = LiquidityPool.load(event.address.toHexString())
    if(event.params.to.toHexString() == ZERO_ADDRESS_STRING && event.params.value.equals(BIGINT_THOUSAND) && pool!.outputTokenSupply == BIGINT_ZERO){
        return;
    }

    if(event.params.from.toHexString() == ZERO_ADDRESS_STRING){
      handleTransferMint(event, pool, event.params.value, event.params.to.toHexString())
    }

    if(event.params.to == event.address){
      handleTransferToPoolBurn(event, event.params.from.toHexString())
    }

    if(event.params.to.toHexString() == ZERO_ADDRESS_STRING && event.params.from == event.address){
      handleTransferBurn(event, pool, event.params.value, event.params.from.toHexString())
    }


}
