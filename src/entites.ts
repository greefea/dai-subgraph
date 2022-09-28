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
  BIGINT_ONE
} from "./constants"
import { ERC20SymbolBytes } from "../generated/Uniswapv2/ERC20SymbolBytes";
import { ERC20NameBytes } from "../generated/Uniswapv2/ERC20NameBytes";

export function getOrToken(adr: Address):Token{
  let id = adr.toHexString();
  let token = Token.load(id);
  if(token != null){
    return token
  } else {
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
    token.save();
  }
  return token
}

export function getOrCreateDexAmmProtocol(id:string):DexAmmProtocol {
    let protocol = DexAmmProtocol.load(id);
    if(protocol != null){
        return protocol
    } else if (protocol == null){
        protocol = new DexAmmProtocol(id);
        protocol.name = 'Uniswap v2'
        protocol.slug = 'uniswap-v2'
        protocol.schemaVersion = '1.3.0'
        protocol.subgraphVersion = '0.0.1'
        protocol.methodologyVersion = '0.0.0'
        protocol.network = 'MAIN NETWORK'
        protocol.type = 'DEX'
        protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
        protocol.protocolControlledValueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
        protocol.cumulativeUniqueUsers = 0;
        protocol.totalPoolCount = 0;
        protocol.dailyUsageMetrics = []
        protocol.hourlyUsageMetrics = []
        protocol.financialMetrics = []
        protocol.pools = []
        protocol.save()
    }
    return protocol
}

// export function CreateLiquidityPool(event:ethereum.Event):LiquidityPool {
//     let pool = LiquidityPool.load(event.address.toHexString())
//     if(pool != null){
//         return pool
//     } else if (pool == null){

//     }
// }