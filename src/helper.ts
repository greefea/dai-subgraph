import { Token, LiquidityPool } from "../generated/schema";
import { Address, BigDecimal, BigInt , ethereum} from "@graphprotocol/graph-ts";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, fetchTokenTotalSupply, toDecimal,  } from "./utils";

import { SECONDS_PER_DAY,  ORACLE_ADDRESS, BIGINT_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, BIGDECIMAL_ONE } from "./constants";
import { ERC20 } from "../generated/Uniswapv2/ERC20";
import { getOrCreateTransfer } from "./entites";




export function getTokenDecimal(tokenAmount:BigInt, tokenDecimal:BigInt):BigDecimal {
  if (tokenDecimal == BIGINT_ZERO){
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(toDecimal(tokenDecimal))
}

export function handleTransferMint(event:ethereum.Event,
    pool:LiquidityPool,
    value: BigInt,
    to:string):void {
    let transfer = getOrCreateTransfer(event);
    pool.outputTokenSupply = pool.outputTokenSupply!.plus(value);
    if(!transfer.type){
        transfer.type = 'Mint'
        transfer.sender = to;
        transfer.liquidity = value;
    }else if(transfer.type == 'Mint'){
        transfer.sender = to;
        transfer.liquidity = value;
    }
    transfer.save();
    pool.save();
    
}

export function handleTransferToPoolBurn(event:ethereum.Event, from:string):void {
    let transfer = getOrCreateTransfer(event);
    transfer.type = "Burn";
    transfer.sender = from;
    transfer.save();
}

export function handleTransferBurn(event:ethereum.Event, pool:LiquidityPool, value:BigInt, from: string):void {
  let transfer = getOrCreateTransfer(event);
  pool.outputTokenSupply = pool.outputTokenSupply!.minus(value);
  if(transfer.type == 'Burn'){
    transfer.liquidity = value;
  }else {
    transfer.type = 'Burn';
    transfer.sender = from;
    transfer.liquidity = value;
  }

  transfer.save()
  pool.save()
}
