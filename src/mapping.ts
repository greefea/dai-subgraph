import { BigInt, log, Address, BigDecimal} from "@graphprotocol/graph-ts";
import { PairCreated } from "../generated/Uniswapv2/Uniswapv2";
import {oracle} from "../generated/Uniswapv2/oracle";
import {ERC20} from "../generated/Uniswapv2/ERC20";
import {Swap} from "../generated/templates/Pair/Pair";
import {Pair} from "../generated/templates"
import { pool, swap, daily } from "../generated/schema";

import { SECONDS_PER_DAY, ORACLE_ADDRESS, DECIMAL_18, DECIMAL_8 } from "./constants";




export function handlePairCreated(event: PairCreated): void {
  let id = event.transaction.hash.toHexString()
  let pl = pool.load(id);
  if(pl == null){
    pl = new pool(id);
  }
  let contract_token0 = ERC20.bind(event.params.token0);
  let contract_token0_symbol = contract_token0.try_symbol();
  if(!contract_token0_symbol.reverted){
    pl.symbol0 = contract_token0_symbol.value;
  }
  let contract_token1 = ERC20.bind(event.params.token1);
  let contract_token1_symbol = contract_token1.try_symbol();
  if(!contract_token1_symbol.reverted){
    pl.symbol1 = contract_token1_symbol.value;
  }
  pl.token0 = event.params.token0.toString();
  pl.token1 = event.params.token1.toString();
  pl.pair = event.params.pair.toString();
  pl.save();
  if(pl.symbol0 == 'DAI' || pl.symbol1 == 'DAI'){
      Pair.create(event.params.pair)
  }
  
}

export function handleSwap(event:Swap):void {
    let id = event.transaction.hash.toHexString();
    let swapentity = swap.load(id);
    if (swapentity == null) {
        swapentity = new swap(id);
    }
    swapentity.to = event.params.to.toHexString();
    swapentity.sender = event.params.sender.toHexString();
    swapentity.amount0In = event.params.amount0In;
    swapentity.amount1In = event.params.amount1In;
    swapentity.amount0Out = event.params.amount0Out;
    swapentity.amount1Out = event.params.amount1Out;
    swapentity.save();
}
