import { ethereum, Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/Uniswapv2/ERC20";
import { Account, ActiveAccount, LiquidityPool, LiquidityPoolDailySnapshot, Token } from "../generated/schema";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";
import { CreateDexAmmProtocol, CreateLiquidityPool, getOrCreateLiquidityPoolDailySnapshot, getOrCreateLiquidityPoolHourlySnapshot, getOrCreateUsageMetricsDailySnapshot, getOrCreateUsageMetricsHourlySnapshot } from "./entites";

export function updateLiquidityPoolMetrics(event:ethereum.Event):void  {
  let eventAddress = event.address.toHexString()
  let pool = LiquidityPool.load(eventAddress)
  let token0 = pool!.inputTokens[0]
  let token1 = pool!.inputTokens[1]
  let LPtoken = pool!.outputToken!
  let ERC20Token0 = ERC20.bind(Address.fromString(token0))
  let ERC20Token1 = ERC20.bind(Address.fromString(token1))
  let ERC20LPToken = ERC20.bind(Address.fromString(LPtoken))
  let token0Balance = ERC20Token0.balanceOf(Address.fromString(eventAddress))
  let token1Balance = ERC20Token1.balanceOf(Address.fromString(eventAddress)) 
  let totalBalance = token0Balance.plus(token1Balance)
  let token0Weight = token0Balance.div(totalBalance).times(BigInt.fromI32(100)).toBigDecimal()
  let token1Weight = token1Balance.div(totalBalance).times(BigInt.fromI32(100)).toBigDecimal()
  let dailyPoolSnapshot = getOrCreateLiquidityPoolDailySnapshot(event)
  dailyPoolSnapshot.blockNumber = event.block.number
  dailyPoolSnapshot.timestamp = event.block.timestamp
  dailyPoolSnapshot.inputTokenBalances = [token0Balance, token1Balance]
  dailyPoolSnapshot.inputTokenWeights = [token0Weight, token1Weight]
  dailyPoolSnapshot.outputTokenSupply = ERC20LPToken.totalSupply()
  dailyPoolSnapshot.save()

  let hourlyPoolSnapshot = getOrCreateLiquidityPoolHourlySnapshot(event)
  hourlyPoolSnapshot.blockNumber = event.block.number
  hourlyPoolSnapshot.timestamp = event.block.timestamp
  hourlyPoolSnapshot.inputTokenBalances = [token0Balance, token1Balance]
  hourlyPoolSnapshot.inputTokenWeights = [token0Weight, token1Weight]
  hourlyPoolSnapshot.outputTokenSupply = ERC20LPToken.totalSupply()
  hourlyPoolSnapshot.save();
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
    dailyProtocolSnapshot.cumulativeUniqueUsers += 1
    hourlyProtocolSnapshot.cumulativeUniqueUsers += 1
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

  protocol.save();
  dailyProtocolSnapshot.save();
  hourlyProtocolSnapshot.save();
}