import { Address,BigDecimal,BigInt,log } from "@graphprotocol/graph-ts";
import { 
  LiquidityPool,
  Token,
  _HelperStore,
  _LiquidityPoolAmount
 } from "../../generated/schema";

import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, 
  BIGINT_ZERO, 
  NATIVE_ADDRESS,
  STABLE_COINS,
  STABLE_ORACLE_POOLS, 
  UNTRACKED_TOKENS,
  MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND,
  UNTRACK_PAIRS,
  WHITELIST_TOKENS,
  MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND,
  BIGDECIMAL_TWO
} from "../constants";
import { getOrCreateToken, getOrCreateTokenWhitelist } from "../entites";
import { safeDiv, convertTokenToDecimal } from "../utils";


export function updateNativeTokenPrice():Token {
  let nativeToken = getOrCreateToken(Address.fromString(NATIVE_ADDRESS))
  let stableAmount = BIGDECIMAL_ZERO
  let nativeAmount = BIGDECIMAL_ZERO
  for (let i = 0; i < STABLE_ORACLE_POOLS.length; i++){
    let pool = _LiquidityPoolAmount.load(STABLE_ORACLE_POOLS[i]);
    if (!pool) continue;
    if(pool.inputTokens[0] == NATIVE_ADDRESS){
      if(pool.inputTokenBalances[1] > stableAmount){
        nativeAmount = pool.inputTokenBalances[0];
        stableAmount = pool.inputTokenBalances[1];
      }
    } else {
      if(pool.inputTokenBalances[0] > stableAmount) {
        nativeAmount = pool.inputTokenBalances[1];
        stableAmount = pool.inputTokenBalances[0];
      }
    }
  }
  nativeToken.lastPriceUSD = safeDiv(stableAmount, nativeAmount);
  nativeToken.save()
  return nativeToken;
}

export function findUSDPriceToken(token:Token, nativeToken: Token):BigDecimal {
  if(token.id == NATIVE_ADDRESS){
    return nativeToken.lastPriceUSD!
  }
  let tokenWhitelist = getOrCreateTokenWhitelist(token.id)
  let whiteList = tokenWhitelist.whitelistPools;

  let largestLiquidityWhitelistTokens = BIGDECIMAL_ZERO;
  let priceSoFar = BIGDECIMAL_ZERO;

  if(STABLE_COINS.includes(token.id)){
    priceSoFar = BIGDECIMAL_ONE;
  } else if (UNTRACKED_TOKENS.includes(token.id)){
    priceSoFar = BIGDECIMAL_ZERO
  } else {
    for(let i = 0; i < whiteList.length; ++i) {
      let poolAddres = whiteList[i]
      let poolAmounts = _LiquidityPoolAmount.load(poolAddres)
      let pool = LiquidityPool.load(poolAddres)
      if (pool!.outputTokenSupply!.gt(BIGINT_ZERO)){
        if (pool!.inputTokens[0] == token.id && pool!.totalValueLockedUSD.gt(MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND)){
          let whitelistToken = getOrCreateToken(Address.fromString(pool!.inputTokens[1]));
          let whitelistTokenLocked = poolAmounts!.inputTokenBalances[1].times(whitelistToken.lastPriceUSD!)
          if(whitelistTokenLocked.gt(largestLiquidityWhitelistTokens)){
            largestLiquidityWhitelistTokens = whitelistTokenLocked
            priceSoFar = safeDiv(poolAmounts!.inputTokenBalances[1], poolAmounts!.inputTokenBalances[0]).times(whitelistToken.lastPriceUSD!);
          }
        }
        if(pool!.inputTokens[1] == token.id && pool!.totalValueLockedUSD.gt(MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND)){
            let whitelistToken = getOrCreateToken(Address.fromString(pool!.inputTokens[0]))
            let whitelistTokenLocked = poolAmounts!.inputTokenBalances[0].times(whitelistToken.lastPriceUSD!)
            if(whitelistTokenLocked.gt(largestLiquidityWhitelistTokens)){
              largestLiquidityWhitelistTokens = whitelistTokenLocked
              priceSoFar = safeDiv(poolAmounts!.inputTokenBalances[0], poolAmounts!.inputTokenBalances[1]).times(whitelistToken.lastPriceUSD!)
            }
        }
      }
    }
  }
  return priceSoFar
}

/**
 * 计算USD总价
 * 通过pool的两个token的amount计算，如果有一个token在token白名单，则使用白名单token的USD单价计算总价
 * 如果两个token都是白名单，则使用tokenUSD单价计算，然后返回两个token的平均值
 * 如果两个token都不是白名单，则返回0
 */
export function getTrackedVolumeUSD(
  poolAddress:string, 
  tokenAmount0: BigDecimal, 
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token ):BigDecimal[] {
  let price0USD = token0.lastPriceUSD!
  let price1USD = token1.lastPriceUSD!
  let poolAmounts = _LiquidityPoolAmount.load(poolAddress)
  if(UNTRACK_PAIRS.includes(poolAddress)){
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
  }

  let poolDeposits = _HelperStore.load(poolAddress)
  if (poolDeposits == null){
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
  }
  if (poolDeposits.valueInt < 5){
    let reserve0USD = convertTokenToDecimal(BigInt.fromString(poolAmounts!.inputTokenBalances[0]!.toString()), token0.decimals).times(price0USD);
    let reserve1USD = convertTokenToDecimal(BigInt.fromString(poolAmounts!.inputTokenBalances[1]!.toString()), token1.decimals).times(price1USD);
    if (WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)){
      if (reserve0USD!.plus(reserve1USD).lt(MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND)){
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
      }
    }
    if (WHITELIST_TOKENS.includes(token0.id) && !WHITELIST_TOKENS.includes(token1.id)) {
      if (reserve0USD!.times(BIGDECIMAL_TWO).lt(MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND)){
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
      }
    }
    if (!WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)) {
      if (reserve1USD!.times(BIGDECIMAL_TWO).lt(MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND)) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
      }
    }
  }

  if(WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)) {
    let token0ValueUSD = convertTokenToDecimal(BigInt.fromString(tokenAmount0.toString()), token0.decimals).times(price0USD);
    let token1ValueUSD = convertTokenToDecimal(BigInt.fromString(tokenAmount1.toString()), token1.decimals).times(price1USD);

    return [token0ValueUSD, token1ValueUSD, token0ValueUSD.plus(token1ValueUSD).div(BIGDECIMAL_TWO)]
  }

  if(!WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)) {
    let token1ValueUSD = convertTokenToDecimal(BigInt.fromString(tokenAmount1.toString()), token1.decimals).times(price1USD);
    return [token1ValueUSD, token1ValueUSD, token1ValueUSD]
  }

  if (WHITELIST_TOKENS.includes(token0.id) && !WHITELIST_TOKENS.includes(token1.id)) {
    let token0ValueUSD = convertTokenToDecimal(BigInt.fromString(tokenAmount0.toString()), token0.decimals).times(price0USD);
    return [token0ValueUSD, token0ValueUSD,  token0ValueUSD]
  }

  return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
}