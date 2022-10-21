import { Address, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import { LiquidityPool, Token } from "../generated/schema";
import { ERC20 } from "../generated/Uniswapv2/ERC20";
import {ERC20NameBytes} from "../generated/Uniswapv2/ERC20NameBytes";
import {ERC20SymbolBytes} from "../generated/Uniswapv2/ERC20SymbolBytes";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "./constants";
import { getUsdPricePerToken } from "./prices";



export function isNullEthValue(value:string):boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}


export function fetchTokenSymbol(tokenAddres:Address):string {
  let contract = ERC20.bind(tokenAddres);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddres);

  
  let symbolValue = 'unknown';
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted){
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted){
      if (!isNullEthValue(symbolResultBytes.value.toHexString())){
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address):string {
  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  let nameValue = 'unknown';
  let nameResult = contract.try_name();
  if (nameResult.reverted){
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted){
      if (!isNullEthValue(nameResultBytes.value.toHexString())){
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress:Address):BigInt {
  let contract = ERC20.bind(tokenAddress);
  let decimalValue = 0;
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted){
    decimalValue = decimalResult.value;
  }
  return BigInt.fromI32(decimalValue as i32)
}

export function fetchTokenTotalSupply(tokenAddress:Address):BigInt {
  let contract = ERC20.bind(tokenAddress);
  let totalSupplyValue = BIGINT_ZERO;
  let totalSupplyResult = contract.try_totalSupply();
  if (!totalSupplyResult.reverted){
    totalSupplyValue = totalSupplyResult.value;
  }
  return totalSupplyValue
}

export function toDecimal(decimalBigInt:BigInt): BigDecimal {
  let DecialValue = "1".concat("0".repeat(decimalBigInt.toI32()))
  return BigDecimal.fromString(DecialValue)
}



export function safeDiv(value0:BigDecimal, value1:BigDecimal):BigDecimal {
  if(value1.equals(BIGDECIMAL_ZERO)){
    return BIGDECIMAL_ZERO
  }else {
    return value0.div(value1)
  }
}

export function convertDecimal(decimal: i32): BigDecimal {
  let DecialValue = "1".concat("0".repeat(decimal))
  return BigDecimal.fromString(DecialValue)
}

export function convertTokenToDecimal(tokenAmount: BigInt, decimal: i32): BigDecimal {
  if (decimal == 0) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(convertDecimal(decimal))
}

export function getPoolTVL(token0Address:string, token1Address:string, poolAddress:string):BigDecimal {
    let token0 = Token.load(token0Address)!
    let token1 = Token.load(token1Address)!
    let pool = LiquidityPool.load(poolAddress)!
    let token0Amount = (convertTokenToDecimal(pool.inputTokenBalances[0], token0.decimals))
    let token1Amount = (convertTokenToDecimal(pool.inputTokenBalances[1], token1.decimals))
    let tvl = (token0.lastPriceUSD!.times(token0Amount)).plus(token1.lastPriceUSD!.times(token1Amount))
    return tvl
}

export function getTokenPrice(token:string):BigDecimal{
  let tokenAddress = Address.fromString(token)
  let tokenPrice: BigDecimal
  let fetchPrice = getUsdPricePerToken(tokenAddress)
  if(!fetchPrice.reverted){
    tokenPrice = fetchPrice.usdPrice.div(fetchPrice.decimalsBaseTen)
  } else {
    tokenPrice = fetchPrice.usdPrice
  }
  return tokenPrice
}

