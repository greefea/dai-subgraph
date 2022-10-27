import { ethereum, Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/Uniswapv2/ERC20";
import { Account, ActiveAccount, DexAmmProtocol, LiquidityPool,
   LiquidityPoolDailySnapshot, Token, _LiquidityPoolAmount,
  _TotalLockedUSD } from "../generated/schema";
import { BIGINT_ZERO, FACTORY_ADDRESS, SECONDS_PER_DAY, SECONDS_PER_HOUR, WHITELIST_TOKENS } from "./constants";
import { CreateDexAmmProtocol,
   getOrCreateFinancialsDailySnapshot, 
   getOrCreateLiquidityPoolDailySnapshot, 
   getOrCreateLiquidityPoolHourlySnapshot, 
   getOrCreateTokenWhitelist, 
   getOrCreateUsageMetricsDailySnapshot, 
   getOrCreateUsageMetricsHourlySnapshot } from "./entites";
import { findUSDPriceToken, updateNativeTokenPrice } from "./price/price";
import { getPoolTVL } from "./utils";
import { getTokenPrice } from "./utils";

export function updateLiquidityPoolMetrics(event:ethereum.Event):void  {
  let eventAddress = event.address.toHexString()
  let pool = LiquidityPool.load(eventAddress)
  let poolAmounts = _LiquidityPoolAmount.load(eventAddress)
  let protocol = CreateDexAmmProtocol()
  let token0 = pool!.inputTokens[0]
  let token1 = pool!.inputTokens[1]
  let LPtoken = pool!.outputToken!
  let ERC20Token0 = ERC20.bind(Address.fromString(token0))
  let ERC20Token1 = ERC20.bind(Address.fromString(token1))
  let ERC20LPToken = ERC20.bind(Address.fromString(LPtoken))
  let token0Balance = BIGINT_ZERO;
  let token1Balance = BIGINT_ZERO;
  let token0result = ERC20Token0.try_balanceOf(Address.fromString(eventAddress))
  let token1result = ERC20Token1.try_balanceOf(Address.fromString(eventAddress)) 
  if(!token0result.reverted){
    token0Balance = token0result.value
  }
  if(!token1result.reverted){
    token1Balance = token1result.value
  }
  pool!.inputTokenBalances = [token0Balance, token1Balance]
  pool!.save();
  let poolOldUSD = pool!.totalValueLockedUSD
  pool!.totalValueLockedUSD = getPoolTVL(token0, token1, eventAddress)

  pool!.save();
  poolAmounts!.inputTokenBalances = [token0Balance.toBigDecimal(), token1Balance.toBigDecimal()]
  poolAmounts!.save()
  protocol.totalValueLockedUSD = protocol!.totalValueLockedUSD.minus(poolOldUSD)
  protocol.totalValueLockedUSD = protocol!.totalValueLockedUSD.plus(pool!.totalValueLockedUSD)
  let tranlog = event.transaction.hash.toHexString().concat(event.logIndex.toString())
  let helpEntity = _TotalLockedUSD.load(tranlog)
  if(helpEntity==null){
    helpEntity = new _TotalLockedUSD(tranlog)
    helpEntity.timestamp = event.block.timestamp
    helpEntity.totalValueLockedUSD = protocol.totalValueLockedUSD
    helpEntity.operationPool = pool!.id
  }
  helpEntity.save()
  protocol.save();
  let dailyPoolSnapshot = getOrCreateLiquidityPoolDailySnapshot(event)
  dailyPoolSnapshot.blockNumber = event.block.number
  dailyPoolSnapshot.timestamp = event.block.timestamp
  dailyPoolSnapshot.inputTokenBalances = [token0Balance, token1Balance]
  dailyPoolSnapshot.totalValueLockedUSD = pool!.totalValueLockedUSD
  dailyPoolSnapshot.cumulativeVolumeUSD = pool!.cumulativeVolumeUSD
  dailyPoolSnapshot.outputTokenSupply = ERC20LPToken.totalSupply()
  dailyPoolSnapshot.save()

  let hourlyPoolSnapshot = getOrCreateLiquidityPoolHourlySnapshot(event)
  hourlyPoolSnapshot.blockNumber = event.block.number
  hourlyPoolSnapshot.timestamp = event.block.timestamp
  hourlyPoolSnapshot.inputTokenBalances = [token0Balance, token1Balance]
  hourlyPoolSnapshot.totalValueLockedUSD = pool!.totalValueLockedUSD
  hourlyPoolSnapshot.cumulativeVolumeUSD = pool!.cumulativeVolumeUSD
  hourlyPoolSnapshot.outputTokenSupply = ERC20LPToken.totalSupply()
  hourlyPoolSnapshot.save();
  updateProtcolFinancialsMetrics(event)
}

export function updateProtocolMetrics(event:ethereum.Event, userAddress:string, eventType:string):void {
  let hour = (event.block.timestamp.toI32()/SECONDS_PER_HOUR).toString()
  let day = (event.block.timestamp.toI32()/SECONDS_PER_DAY).toString()
  let protocol = CreateDexAmmProtocol()
  let dailyProtocolSnapshot = getOrCreateUsageMetricsDailySnapshot(event)
  let hourlyProtocolSnapshot = getOrCreateUsageMetricsHourlySnapshot(event)
  let user = Account.load(userAddress)
  if (user == null) {
    protocol.cumulativeUniqueUsers += 1
    dailyProtocolSnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers
    hourlyProtocolSnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers
  }
  let dailyactiveUser = ActiveAccount.load('daily'+userAddress+day)
  if (dailyactiveUser == null){
    dailyProtocolSnapshot.dailyActiveUsers += 1;
  }
  let hourlyactiveUser = ActiveAccount.load('hourly'+userAddress+hour)
  if (hourlyactiveUser == null){
    hourlyProtocolSnapshot.hourlyActiveUsers += 1;
  }
  dailyProtocolSnapshot.dailyTransactionCount += 1;
  hourlyProtocolSnapshot.hourlyTransactionCount += 1;
  if (eventType == 'DESPOSIT'){
    dailyProtocolSnapshot.dailyDepositCount += 1;
    hourlyProtocolSnapshot.hourlyDepositCount += 1;
  } else if (eventType == 'WITHDRAW'){
    dailyProtocolSnapshot.dailyWithdrawCount += 1;
    hourlyProtocolSnapshot.hourlyWithdrawCount += 1;
  } else if (eventType == 'SWAP'){
    dailyProtocolSnapshot.dailySwapCount += 1;
    hourlyProtocolSnapshot.hourlySwapCount += 1;
  }
  dailyProtocolSnapshot.totalPoolCount = protocol.totalPoolCount
  protocol.save();
  dailyProtocolSnapshot.save();
  hourlyProtocolSnapshot.save();
}

export function updateProtcolFinancialsMetrics(event:ethereum.Event):void {
  let day = event.block.timestamp.toI32()/SECONDS_PER_DAY
  let id = day.toString()
  let dailyFinancialsSnapshot = getOrCreateFinancialsDailySnapshot(event)
  let pool = LiquidityPool.load(event.address.toHexString())!
  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS);

  let tvl = dailyFinancialsSnapshot.totalValueLockedUSD.plus(pool.totalValueLockedUSD)
  dailyFinancialsSnapshot.totalValueLockedUSD = tvl
  dailyFinancialsSnapshot.cumulativeVolumeUSD = protocol!.cumulativeVolumeUSD
  dailyFinancialsSnapshot.save()

  
}

export function updateTokenWhitelists(token0:string, token1:string, poolAddress:string):void {
  let tokenWhitelist0 = getOrCreateTokenWhitelist(token0)
  let tokenWhitelist1 = getOrCreateTokenWhitelist(token1)
  if(WHITELIST_TOKENS.includes(token0)){
    let newPools = tokenWhitelist1.whitelistPools
    newPools.push(poolAddress);
    tokenWhitelist1.whitelistPools = newPools;
    tokenWhitelist1.save();
  }
  if(WHITELIST_TOKENS.includes(token1)){
    let newPools = tokenWhitelist0.whitelistPools
    newPools.push(poolAddress)
    tokenWhitelist0.whitelistPools = newPools
    tokenWhitelist0.save()
  }
}


export function updateTokenPrice(event:ethereum.Event):void {
  let blocknum = event.block.number
  let pool = LiquidityPool.load(event.address.toHexString())!
  let nativeToken = updateNativeTokenPrice()

  let token0 = Token.load(pool.inputTokens[0])!
  let token1 = Token.load(pool.inputTokens[1])!

  let token0Price = getTokenPrice(token0.id)
  let token1Price = getTokenPrice(token1.id)
  log.info("[updateTokenPrice]{},token0:{},token0Price:{},token1:{},token1Price:{}",
      [event.block.timestamp.toString(),
      token0.id,
      token0Price.toString(),
      token1.id,
      token1Price.toString()])
  token0.lastPriceUSD = token0Price
  token0.lastPriceBlockNumber = blocknum
  token1.lastPriceUSD = token1Price
  token1.lastPriceBlockNumber = blocknum
  token0.save()
  token1.save()
}

export function updateVolumeAndFees(
  event:ethereum.Event,
  protocol:string,
  pool:string,
  trackedAmountUSD: BigDecimal[],
  token0Amount: BigInt,
  token1Amount: BigInt):void {
  let dailyFinancialsSnapshot = getOrCreateFinancialsDailySnapshot(event)
  let dailypoolSnapshot = getOrCreateLiquidityPoolDailySnapshot(event)
  let hourlypoolSnapshot = getOrCreateLiquidityPoolHourlySnapshot(event)
  let protocolentity = DexAmmProtocol.load(protocol)
  let poolentity = LiquidityPool.load(pool)
  let supplyFee = BigDecimal.fromString('0.25').div(BigDecimal.fromString('100'))
  let protocolFee = BigDecimal.fromString('0.05').div(BigDecimal.fromString('100'))

  dailypoolSnapshot.dailyVolumeByTokenUSD = [
    dailypoolSnapshot.dailyVolumeByTokenUSD[0].plus(trackedAmountUSD[0]),
    dailypoolSnapshot.dailyVolumeByTokenUSD[1].plus(trackedAmountUSD[1])
  ]
  dailypoolSnapshot.dailyVolumeByTokenAmount = [
    dailypoolSnapshot.dailyVolumeByTokenAmount[0].plus(token0Amount),
    dailypoolSnapshot.dailyVolumeByTokenAmount[1].plus(token1Amount)
  ]
  hourlypoolSnapshot.hourlyVolumeByTokenUSD = [
    hourlypoolSnapshot.hourlyVolumeByTokenUSD[0].plus(trackedAmountUSD[0]),
    hourlypoolSnapshot.hourlyVolumeByTokenUSD[1].plus(trackedAmountUSD[1])
  ]
  hourlypoolSnapshot.hourlyVolumeByTokenAmount = [
    hourlypoolSnapshot.hourlyVolumeByTokenAmount[0].plus(token0Amount),
    hourlypoolSnapshot.hourlyVolumeByTokenAmount[1].plus(token1Amount)
  ]

  dailypoolSnapshot.dailyVolumeUSD = dailypoolSnapshot.dailyVolumeUSD.plus(trackedAmountUSD[2])
  hourlypoolSnapshot.hourlyVolumeUSD = hourlypoolSnapshot.hourlyVolumeUSD.plus(trackedAmountUSD[2])

  dailyFinancialsSnapshot.dailyVolumeUSD = dailyFinancialsSnapshot.dailyVolumeUSD.plus(trackedAmountUSD[2])
  
  poolentity!.cumulativeVolumeUSD = poolentity!.cumulativeVolumeUSD.plus(trackedAmountUSD[2])
  protocolentity!.cumulativeVolumeUSD = protocolentity!.cumulativeVolumeUSD.plus(trackedAmountUSD[2])

  let supplyFeeAmountUSD = trackedAmountUSD[2].times(supplyFee)
  let protocolFeeAmountUSD = trackedAmountUSD[2].times(protocolFee)
  let tradingFeeAmountUSD = supplyFeeAmountUSD.plus(protocolFeeAmountUSD)

  protocolentity!.cumulativeTotalRevenueUSD = protocolentity!.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD)
  protocolentity!.cumulativeSupplySideRevenueUSD = protocolentity!.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD)
  protocolentity!.cumulativeProtocolSideRevenueUSD = protocolentity!.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD)
  
  poolentity!.cumulativeTotalRevenueUSD = poolentity!.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD)
  poolentity!.cumulativeSupplySideRevenueUSD = poolentity!.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD)
  poolentity!.cumulativeProtocolSideRevenueUSD = poolentity!.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD)

  dailyFinancialsSnapshot.dailyTotalRevenueUSD = dailyFinancialsSnapshot.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD)
  dailyFinancialsSnapshot.dailySupplySideRevenueUSD = dailyFinancialsSnapshot.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  dailyFinancialsSnapshot.dailyProtocolSideRevenueUSD = dailyFinancialsSnapshot.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD)

  dailyFinancialsSnapshot.cumulativeTotalRevenueUSD = protocolentity!.cumulativeTotalRevenueUSD
  dailyFinancialsSnapshot.cumulativeProtocolSideRevenueUSD = protocolentity!.cumulativeProtocolSideRevenueUSD;
  dailyFinancialsSnapshot.cumulativeSupplySideRevenueUSD = protocolentity!.cumulativeSupplySideRevenueUSD;

  dailypoolSnapshot.dailyTotalRevenueUSD = dailypoolSnapshot.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  dailypoolSnapshot.dailySupplySideRevenueUSD = dailypoolSnapshot.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  dailypoolSnapshot.dailyProtocolSideRevenueUSD = dailypoolSnapshot.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  dailypoolSnapshot.cumulativeTotalRevenueUSD = poolentity!.cumulativeTotalRevenueUSD;
  dailypoolSnapshot.cumulativeSupplySideRevenueUSD = poolentity!.cumulativeSupplySideRevenueUSD;
  dailypoolSnapshot.cumulativeProtocolSideRevenueUSD = poolentity!.cumulativeProtocolSideRevenueUSD;

  hourlypoolSnapshot.hourlyTotalRevenueUSD = hourlypoolSnapshot.hourlyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  hourlypoolSnapshot.hourlySupplySideRevenueUSD = hourlypoolSnapshot.hourlySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  hourlypoolSnapshot.hourlyProtocolSideRevenueUSD = hourlypoolSnapshot.hourlyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  hourlypoolSnapshot.cumulativeTotalRevenueUSD = poolentity!.cumulativeTotalRevenueUSD;
  hourlypoolSnapshot.cumulativeSupplySideRevenueUSD = poolentity!.cumulativeSupplySideRevenueUSD;
  hourlypoolSnapshot.cumulativeProtocolSideRevenueUSD = poolentity!.cumulativeProtocolSideRevenueUSD;

  protocolentity!.save()
  poolentity!.save()
  dailyFinancialsSnapshot.save()
  dailypoolSnapshot.save()
  hourlypoolSnapshot.save()


}