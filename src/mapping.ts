import { BigInt, log, Address, BigDecimal} from "@graphprotocol/graph-ts";
import { PairCreated} from "../generated/Uniswapv2/Uniswapv2";
import {oracle} from "../generated/Uniswapv2/oracle";
import {ERC20} from "../generated/Uniswapv2/ERC20";
import {Swap, Sync, Mint, Burn} from "../generated/templates/Pair/Pair";
import { Transfer } from "../generated/templates/Token/ERC20";
import {Pair as PairTemplate, Token as DAITemplate} from "../generated/templates"
import { pool, swap, daily, activeAccount,token, dailyToken } from "../generated/schema";

import { SECONDS_PER_DAY, ORACLE_ADDRESS, BIGINT_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, BIGDECIMAL_ONE, DAI_ADDRESS} from "./constants";
import { getOrCreateDaily, getOrCreateDailyPool, getOrCreateDailyToken, getOrCreatePool, getOrCreateSwap, getOrCreateToken, updateDailyPool } from "./helper";
import { toDecimal } from "./utils";




export function handlePairCreated(event: PairCreated): void {
  let token0 = getOrCreateToken(event.params.token0);
  let token1 = getOrCreateToken(event.params.token1);

  if (token0.symbol=='DAI'||token1.symbol=='DAI'){
    let id = event.params.pair.toHexString()
    let pl = getOrCreatePool(id);
    pl.token0 = token0.id;
    pl.token1 = token1.id;
    PairTemplate.create(event.params.pair)
    pl.save();
    if (token0.symbol == 'DAI'){
        DAITemplate.create(event.params.token0)
    } else {
        DAITemplate.create(event.params.token1)
    }
  }
}

export function handleSwap(event:Swap):void {
  let id = event.transaction.hash.toHexString();
  let swapentity = getOrCreateSwap(id)
  swapentity.to = event.params.to.toHexString();
  swapentity.sender = event.params.sender.toHexString();
  swapentity.pair = event.address.toHexString();
  swapentity.amount0In = event.params.amount0In;
  swapentity.amount1In = event.params.amount1In;
  swapentity.amount0Out = event.params.amount0Out;
  swapentity.amount1Out = event.params.amount1Out;
  swapentity.save();

  let dayid = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let day = dayid.toString();
  let dailyentity = getOrCreateDaily(day)
  let pairid = event.address.toHexString();
  let pair = pool.load(pairid);
  let token0 = token.load(pair!.token0)
  let token1 = token.load(pair!.token1)
  let token0Decimal = token0!.decimals as BigInt
  let token1Decimal = token1!.decimals as BigInt
  let contractoracle = oracle.bind(ORACLE_ADDRESS)
  let priceDecimal = BigInt.fromI32(8);
  let priceValue = contractoracle.latestAnswer();

  let price = priceValue.toBigDecimal().div(toDecimal(priceDecimal))
  let totalAmount0 = (event.params.amount0In.plus(event.params.amount0Out)).toBigDecimal().div(toDecimal(token0Decimal))
  let totalAmount1 = (event.params.amount1In.plus(event.params.amount1Out)).toBigDecimal().div(toDecimal(token1Decimal))


  if (token0!.symbol == 'DAI') {
    dailyentity.swapCount = dailyentity.swapCount!.plus(BIGDECIMAL_ONE);
    dailyentity.totalSwapUSD = dailyentity.totalSwapUSD.plus(totalAmount0.times(price));
    dailyentity.totalSwapAmount = dailyentity.totalSwapAmount!.plus((event.params.amount0In.plus(event.params.amount0Out)).toBigDecimal());
  } else if (token1!.symbol == 'DAI') {
    dailyentity.swapCount = dailyentity.swapCount!.plus(BIGDECIMAL_ONE);
    dailyentity.totalSwapUSD = dailyentity.totalSwapUSD.plus(totalAmount1.times(price))
    dailyentity.totalSwapAmount = dailyentity.totalSwapAmount!.plus((event.params.amount1In.plus(event.params.amount1Out)).toBigDecimal());
  }
  let from = event.params.sender.toHexString();
  let account = activeAccount.load(from.concat("-").concat(day));
  if (account == null) {
      account = new activeAccount(from.concat("-").concat(day));
      dailyentity.swapAccountCount = dailyentity.swapAccountCount.plus(BIGDECIMAL_ONE);
      account.save();
  }
  let pre_pool = getOrCreateDailyPool(day.concat('_').concat(pairid));
  let updatePool = updateDailyPool(event);
  dailyentity.totalLiquidity = dailyentity.totalLiquidity!.minus(pre_pool.dailyDAILiquidity).plus(updatePool.dailyDAILiquidity);

  let dailytokens = getOrCreateDailyToken(day);
  if (dailytokens.dailySupply != BIGDECIMAL_ZERO && dailytokens.dailyTransferAmount != BIGDECIMAL_ZERO && dailytokens.dailyTransferCount!= BIGDECIMAL_ZERO){
      dailyentity.DAILiquidityRate = dailyentity.totalLiquidity!.div(dailytokens.dailySupply!)
      dailyentity.DAISwapAmountRate = dailyentity.totalSwapAmount!.div(dailytokens.dailyTransferAmount!)
      dailyentity.DAISwapCountRate = dailyentity.swapCount!.div(dailytokens.dailyTransferCount!)
  }
  dailyentity.save();
  dailytokens.save();
}

export function handleSync(event:Sync):void {
  // let id = event.address.toHexString();
  // let pair = pool.load(id);
  // pair!.reserve0 = pair!.reserve0.plus(event.params.reserve0.toBigDecimal());
  // pair!.reserve1 = pair!.reserve1.plus(event.params.reserve1.toBigDecimal());
  // pair!.save();
  // let day = (event.block.timestamp.toI32()/SECONDS_PER_DAY).toString();
  // let dailyentity = daily.load(day);

  // if(dailyentity == null){
  //   dailyentity = new daily(day);
  //   dailyentity.totalLiquidity = BIGDECIMAL_ZERO;
  //   dailyentity.totalSwapUSD = BIGDECIMAL_ZERO;
  //   dailyentity.totalSwapAmount = BIGDECIMAL_ZERO;
  //   dailyentity.swapCount = BIGDECIMAL_ZERO;
  //   dailyentity.swapAccountCount = BIGDECIMAL_ZERO;
  // }
  // let token0 = token.load(pair!.token0)
  // let token1 = token.load(pair!.token1)
  // if(token0!.symbol == 'DAI'){
  //   dailyentity.totalLiquidity = dailyentity.totalLiquidity!.plus(event.params.reserve0.toBigDecimal())
  //   dailyentity.save();
  // } else if(token1!.symbol == 'DAI'){
  //   dailyentity.totalLiquidity = dailyentity.totalLiquidity!.plus(event.params.reserve1.toBigDecimal())
  //   dailyentity.save();
  // }
  
}

export function tokenHandleTransfer(event:Transfer):void {
  let day = (event.block.timestamp.toI32()/SECONDS_PER_DAY).toString();
  let dai = ERC20.bind(event.address)
  let dailyDAI = getOrCreateDailyToken(day)
  dailyDAI.dailySupply = dai.totalSupply().toBigDecimal();
  dailyDAI.dailyTransferCount = dailyDAI.dailyTransferCount!.plus(BIGDECIMAL_ONE)
  dailyDAI.dailyTransferAmount = dailyDAI.dailyTransferAmount!.plus(event.params.value.toBigDecimal())
  dailyDAI.save();
}

export function handleMint(event:Mint):void  {
  let dayid = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let day = dayid.toString();
  let dailyentity = getOrCreateDaily(day)
  let pairid = event.address.toHexString();
  let pre_pool = getOrCreateDailyPool(day.concat('_').concat(pairid));
  let updatePool = updateDailyPool(event);
  let daiContract = ERC20.bind(DAI_ADDRESS)
  dailyentity.totalLiquidity = dailyentity.totalLiquidity!.minus(pre_pool.dailyDAILiquidity).plus(updatePool.dailyDAILiquidity);
  if (daiContract.totalSupply().toBigDecimal() != BIGDECIMAL_ZERO) {
    dailyentity.DAILiquidityRate = dailyentity.totalLiquidity!.div(daiContract.totalSupply().toBigDecimal())
  }
  dailyentity.save();

}

export function handleBurn(event:Burn):void{
  let dayid = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let day = dayid.toString();
  let dailyentity = getOrCreateDaily(day)
  let pairid = event.address.toHexString();
  let pre_pool = getOrCreateDailyPool(day.concat('_').concat(pairid));
  let updatePool = updateDailyPool(event);
  let daiContract = ERC20.bind(DAI_ADDRESS)
  dailyentity.totalLiquidity = dailyentity.totalLiquidity!.minus(pre_pool.dailyDAILiquidity).plus(updatePool.dailyDAILiquidity);
  if (daiContract.totalSupply().toBigDecimal() != BIGDECIMAL_ZERO ) {
    dailyentity.DAILiquidityRate = dailyentity.totalLiquidity!.div(daiContract.totalSupply().toBigDecimal())
  }
  dailyentity.save();
}
