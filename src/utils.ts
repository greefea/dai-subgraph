import { Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import { Token } from "../generated/schema";
import { ERC20 } from "../generated/Uniswapv2/ERC20";
import {ERC20NameBytes} from "../generated/Uniswapv2/ERC20NameBytes";
import {ERC20SymbolBytes} from "../generated/Uniswapv2/ERC20SymbolBytes";
import { BIGINT_ZERO } from "./constants";



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

export function fetchERC20TokenInfo(token:Token): Token {
  
}