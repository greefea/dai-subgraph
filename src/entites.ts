import { 
  Token,
  RewardToken,
  LiquidityPoolFee,
  DexAmmProtocol,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  FinancialsDailySnapshot,
  LiquidityPool,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  Deposit,
  Withdraw,
  Swap,
  Account,
  ActiveAccount
 } from "../generated/schema";

 import { ERC20 } from "../generated/Uniswapv2/ERC20";

import {Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts"
import { 
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  fetchTokenTotalSupply,
  fetchERC20TokenInfo,
  isNullEthValue
 } from "./utils";
import {
  BIGINT_ZERO,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  DEFAULT_DECIMAL,
  FACTORY_ADDRESS,
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  BIGDECIMAL_50,
  Network,
  ProtocolType
} from "./constants"
import { ERC20SymbolBytes } from "../generated/Uniswapv2/ERC20SymbolBytes";
import { ERC20NameBytes } from "../generated/Uniswapv2/ERC20NameBytes";

import { Mint, Burn, Swap as SwapEvent } from "../generated/templates/Pair/Pair";
import { getPrice } from "./oracle";

export function getOrCreateToken(adr: Address):Token{
  let id = adr.toHexString();
  let token = Token.load(id);
  let price = getPrice(id).toBigDecimal();
  if(token == null){
    token = new Token(id);
    let contract = ERC20.bind(adr);
    let contractSymbolBytes = ERC20SymbolBytes.bind(adr);
    let contractNameBytes = ERC20NameBytes.bind(adr);
    let symbolValue = 'unknown';
    let nameValue = 'unknown';

    let symbolResult = contract.try_symbol();
    if(symbolResult.reverted){
      let symbolResultBytes = contractSymbolBytes.try_symbol();
      if(!symbolResultBytes.reverted){
        if(isNullEthValue(symbolResultBytes.value.toHexString())){
          symbolValue = symbolResultBytes.value.toString();
        }
      }
    } else {
      symbolValue = symbolResult.value;
    }
    token.symbol = symbolValue;

    let nameResult = contract.try_name();
    if(nameResult.reverted){
      let nameResultBytes = contractNameBytes.try_name();
      if(!nameResultBytes.reverted){
        if(isNullEthValue(nameResultBytes.value.toHexString())) {
          nameValue = nameResultBytes.value.toString();
        }
      }
    } else {
      nameValue = nameResult.value;
    }
    token.name = nameValue;

    let decimalValue = 0;
    let decimalResult = contract.try_decimals();
    if(!decimalResult.reverted){
      decimalValue = decimalResult.value
    }
    token.decimals = decimalValue;
    token.lastPriceUSD = price;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token.save();
  }
  return token
}

export function getOrCreateLPToken(pairAddress:string, token0:Token, token1:Token):Token {
    let lptoken = Token.load(pairAddress);
    if(lptoken == null){
        lptoken = new Token(pairAddress);
        lptoken.name = token0.name + '/' + token1.name
        lptoken.symbol = token0.symbol + '/'+token1.symbol + 'LP'
        lptoken.decimals = DEFAULT_DECIMAL;
        lptoken.lastPriceUSD = BIGDECIMAL_ZERO;
        lptoken.lastPriceBlockNumber = BIGINT_ZERO;
        lptoken.save()
    }
    return lptoken
}

export function CreateDexAmmProtocol():DexAmmProtocol {
    let id = FACTORY_ADDRESS
    let protocol = DexAmmProtocol.load(id);
    if(protocol == null){
        protocol = new DexAmmProtocol(id);
        protocol.name = 'Uniswap v2'
        protocol.slug = 'uniswap-v2'
        protocol.schemaVersion = '1.3.0'
        protocol.subgraphVersion = '0.0.1'
        protocol.methodologyVersion = '0.0.0'
        protocol.network = Network.MAINNET
        protocol.type = ProtocolType.EXCHANGE
        protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
        protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO
        protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeUniqueUsers = 0;
        protocol.totalPoolCount = 0;
        protocol.save()
    }
    return protocol
}

export function getOrCreateUsageMetricsDailySnapshot(event:ethereum.Event):UsageMetricsDailySnapshot {
    let day = event.block.timestamp.toI32()/SECONDS_PER_DAY
    let id = day.toString()
    let dailySnapshots = UsageMetricsDailySnapshot.load(id)
    if(dailySnapshots == null){
        dailySnapshots = new UsageMetricsDailySnapshot(id)
        dailySnapshots.protocol = FACTORY_ADDRESS
        dailySnapshots.dailyActiveUsers = INT_ZERO;
        dailySnapshots.cumulativeUniqueUsers = INT_ZERO;
        dailySnapshots.dailyTransactionCount = INT_ZERO;
        dailySnapshots.dailyDepositCount = INT_ZERO;
        dailySnapshots.dailyWithdrawCount = INT_ZERO;
        dailySnapshots.dailySwapCount = INT_ZERO;
        dailySnapshots.totalPoolCount = INT_ZERO;
        dailySnapshots.blockNumber = event.block.number;
        dailySnapshots.timestamp = event.block.timestamp;
        dailySnapshots.save()
    }
    return dailySnapshots
}

export function getOrCreateUsageMetricsHourlySnapshot(event: ethereum.Event): UsageMetricsHourlySnapshot {
    let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR
    let id = hour.toString()
    let hourlySnapshots = UsageMetricsHourlySnapshot.load(id)
    if (hourlySnapshots == null) {
        hourlySnapshots = new UsageMetricsHourlySnapshot(id)
        hourlySnapshots.protocol = FACTORY_ADDRESS
        hourlySnapshots.hourlyActiveUsers = INT_ZERO;
        hourlySnapshots.cumulativeUniqueUsers = INT_ZERO;
        hourlySnapshots.hourlyTransactionCount = INT_ZERO;
        hourlySnapshots.hourlyDepositCount = INT_ZERO;
        hourlySnapshots.hourlyWithdrawCount = INT_ZERO;
        hourlySnapshots.hourlySwapCount = INT_ZERO;
        hourlySnapshots.blockNumber = event.block.number;
        hourlySnapshots.timestamp = event.block.timestamp;
        hourlySnapshots.save()
    }
    return hourlySnapshots
}

export function getOrCreateFinancialsDailySnapshot(event:ethereum.Event):FinancialsDailySnapshot {
    let day = event.block.timestamp.toI32()/SECONDS_PER_DAY
    let id = day.toString()
    let dailyFinancialsSnapshot = FinancialsDailySnapshot.load(id)
    if(dailyFinancialsSnapshot == null){
        dailyFinancialsSnapshot = new FinancialsDailySnapshot(id)
        dailyFinancialsSnapshot.protocol = FACTORY_ADDRESS;
        dailyFinancialsSnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.protocolControlledValueUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.dailyVolumeUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
        dailyFinancialsSnapshot.blockNumber = event.block.number;
        dailyFinancialsSnapshot.timestamp = event.block.timestamp;
        dailyFinancialsSnapshot.save();
    }
    return dailyFinancialsSnapshot
}

export function CreateLiquidityPool(event:ethereum.Event,poolAddress:string, token0:Token, token1:Token, LPtoken:Token):LiquidityPool {
  let id = poolAddress
  let pool = LiquidityPool.load(id)
  if (pool == null) {
    pool = new LiquidityPool(id);
    pool.protocol = FACTORY_ADDRESS
    pool.name = token0.name.concat('/').concat(token1.name);
    pool.symbol = token0.name.concat('/').concat(token1.name)
    pool.inputTokens = [token0.id, token1.id]
    pool.outputToken = LPtoken.id;
    pool.rewardTokens = []
    pool.fees = []
    pool.isSingleSided = false
    pool.createdTimestamp = event.block.timestamp
    pool.createdBlockNumber = event.block.number
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO]
    pool.inputTokenWeights = [BIGDECIMAL_50, BIGDECIMAL_50]
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO]
    pool.save()
  }
  return pool
}

export function getOrCreateLiquidityPoolDailySnapshot(event:ethereum.Event):LiquidityPoolDailySnapshot {
  let day = event.block.timestamp.toI32()/SECONDS_PER_DAY
  let poolAddress = event.address.toHexString()
  let id = poolAddress.concat('-').concat(day.toString())
  let dailyLiquiditySnapshot = LiquidityPoolDailySnapshot.load(id)
  if(dailyLiquiditySnapshot == null){
    let pool = LiquidityPool.load(poolAddress)
    dailyLiquiditySnapshot = new LiquidityPoolDailySnapshot(id)
    dailyLiquiditySnapshot.protocol = FACTORY_ADDRESS;
    dailyLiquiditySnapshot.pool = pool!.id
    dailyLiquiditySnapshot.blockNumber = event.block.number;
    dailyLiquiditySnapshot.timestamp = event.block.timestamp;
    dailyLiquiditySnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.dailyVolumeUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.dailyVolumeByTokenAmount = [BIGINT_ONE, BIGINT_ZERO];
    dailyLiquiditySnapshot.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    dailyLiquiditySnapshot.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    dailyLiquiditySnapshot.inputTokenWeights = [BIGDECIMAL_50, BIGDECIMAL_50];
    dailyLiquiditySnapshot.outputTokenSupply = BIGINT_ZERO;
    dailyLiquiditySnapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    dailyLiquiditySnapshot.stakedOutputTokenAmount = BIGINT_ZERO;
    dailyLiquiditySnapshot.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    dailyLiquiditySnapshot.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO]
    dailyLiquiditySnapshot.save()
  }
  return dailyLiquiditySnapshot

}


export function getOrCreateLiquidityPoolHourlySnapshot(event: ethereum.Event): LiquidityPoolHourlySnapshot {
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR
  let poolAddress = event.address.toHexString()
  let id = poolAddress.concat('-').concat(hour.toString())
  let hourlyLiquiditySnapshot = LiquidityPoolHourlySnapshot.load(id)
  if (hourlyLiquiditySnapshot == null) {
    let pool = LiquidityPool.load(poolAddress)
    hourlyLiquiditySnapshot = new LiquidityPoolHourlySnapshot(id)
    hourlyLiquiditySnapshot.protocol = FACTORY_ADDRESS;
    hourlyLiquiditySnapshot.pool = pool!.id
    hourlyLiquiditySnapshot.blockNumber = event.block.number;
    hourlyLiquiditySnapshot.timestamp = event.block.timestamp;
    hourlyLiquiditySnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.hourlyVolumeByTokenAmount = [BIGINT_ONE, BIGINT_ZERO];
    hourlyLiquiditySnapshot.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    hourlyLiquiditySnapshot.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    hourlyLiquiditySnapshot.inputTokenWeights = [BIGDECIMAL_50, BIGDECIMAL_50];
    hourlyLiquiditySnapshot.outputTokenSupply = BIGINT_ZERO;
    hourlyLiquiditySnapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    hourlyLiquiditySnapshot.stakedOutputTokenAmount = BIGINT_ZERO;
    hourlyLiquiditySnapshot.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    hourlyLiquiditySnapshot.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO]
    hourlyLiquiditySnapshot.save()
  }
  return hourlyLiquiditySnapshot

}

export function getOrCreateDeposit(event:Mint):Deposit {
  let hash = event.transaction.hash.toHexString()
  let logIndex = event.transactionLogIndex.toI32()
  let id = 'deposit' + hash.concat('-').concat(logIndex.toString())
  let depositEntity = Deposit.load(id)
  if(depositEntity == null){
    depositEntity = new Deposit(id)
    let pairAddress = event.address.toHexString()
    let pool = LiquidityPool.load(pairAddress)
    depositEntity.hash = hash
    depositEntity.logIndex = logIndex
    depositEntity.protocol = FACTORY_ADDRESS
    depositEntity.to = event.address.toHexString()
    depositEntity.from = event.params.sender.toHexString()
    depositEntity.blockNumber = event.block.number;
    depositEntity.timestamp = event.block.timestamp;
    depositEntity.inputTokens = pool!.inputTokens;
    depositEntity.outputToken = pool!.outputToken;
    depositEntity.inputTokenAmounts = [event.params.amount0,event.params.amount0]
    depositEntity.outputTokenAmount = BIGINT_ZERO;
    depositEntity.amountUSD = BIGDECIMAL_ZERO;
    depositEntity.pool = pool!.id
    depositEntity.save();
  }
  return depositEntity
}

export function getOrCreateWithdraw(event:Burn):Withdraw {
  let hash = event.transaction.hash.toHexString()
  let logIndex = event.transactionLogIndex.toI32()
  let id = 'withdraw'+ hash.concat('-').concat(logIndex.toString())
  let withdrawEntity = Withdraw.load(id)
  if(withdrawEntity == null){
    let pairAddress = event.address.toHexString()
    let pool = LiquidityPool.load(pairAddress)
    withdrawEntity = new Withdraw(id);
    withdrawEntity.hash = hash
    withdrawEntity.logIndex = logIndex
    withdrawEntity.protocol = FACTORY_ADDRESS
    withdrawEntity.to = event.params.to.toHexString();
    withdrawEntity.from = event.params.sender.toHexString();
    withdrawEntity.blockNumber = event.block.number;
    withdrawEntity.timestamp = event.block.timestamp
    withdrawEntity.inputTokens = pool!.inputTokens
    withdrawEntity.outputToken = pool!.outputToken
    withdrawEntity.inputTokenAmounts = [event.params.amount0, event.params.amount1]
    withdrawEntity.outputTokenAmount = BIGINT_ZERO;
    withdrawEntity.amountUSD = BIGDECIMAL_ZERO;
    withdrawEntity.pool = pool!.id
    withdrawEntity.save()
  }
  return withdrawEntity
}

export function getOrCreateSwap(event:SwapEvent):Swap {
  let hash = event.transaction.hash.toHexString()
  let logIndex = event.transactionLogIndex.toI32()
  let id = 'swap' + hash.concat('-').concat(logIndex.toString())
  let swapEntity = Swap.load(id)
  if(swapEntity == null){
    let pairAddress = event.address.toHexString()
    let pool = LiquidityPool.load(pairAddress)
    let tokenIn = event.params.amount0In > BIGINT_ZERO ? pool!.inputTokens[0]:pool!.inputTokens[1]
    let amountIn = event.params.amount0In > event.params.amount1In ? event.params.amount0In:event.params.amount1In
    let tokenOut = event.params.amount0Out > event.params.amount1Out ? pool!.inputTokens[0]:pool!.inputTokens[1]
    let amountOut = event.params.amount0Out > event.params.amount1Out ? event.params.amount0Out:event.params.amount1Out
    swapEntity = new Swap(id);
    swapEntity.hash = hash
    swapEntity.logIndex = logIndex
    swapEntity.protocol = FACTORY_ADDRESS;
    swapEntity.to = event.params.to.toHexString();
    swapEntity.from = event.params.sender.toHexString();
    swapEntity.blockNumber = event.block.number
    swapEntity.timestamp = event.block.timestamp
    swapEntity.tokenIn = tokenIn
    swapEntity.amountIn = amountIn
    swapEntity.amountInUSD = BIGDECIMAL_ZERO;
    swapEntity.tokenOut = tokenOut
    swapEntity.amountOut = amountOut
    swapEntity.amountOutUSD = BIGDECIMAL_ZERO;
    swapEntity.pool = pool!.id
    swapEntity.save()
  }
  return swapEntity
}

