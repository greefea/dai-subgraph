import { BigInt, log, Address, BigDecimal} from "@graphprotocol/graph-ts";
import { PairCreated} from "../generated/Uniswapv2/Uniswapv2";
import {oracle} from "../generated/Uniswapv2/oracle";
import {ERC20} from "../generated/Uniswapv2/ERC20";
import {Mint, Swap,Burn, Sync} from "../generated/templates/Pair/Pair";
import { Transfer } from "../generated/templates/Token/ERC20";
import {Pair as PairTemplate} from "../generated/templates"
import { LiquidityPool } from "../generated/schema";
import { updateLiquidityPoolMetrics } from "./updateMetrics"

import { SECONDS_PER_DAY, ORACLE_ADDRESS, BIGINT_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, BIGDECIMAL_ONE} from "./constants";
import { toDecimal } from "./utils";
import { CreateDexAmmProtocol, 
  getOrCreateToken, 
  getOrCreateLPToken, 
  CreateLiquidityPool, 
  getOrCreateSwap,
  getOrCreateDeposit, 
  getOrCreateWithdraw} from "./entites";




export function handlePairCreated(event: PairCreated): void {
  let pair = event.params.pair;
  let poolAddres = pair.toHexString()
  let protocol = CreateDexAmmProtocol()
  let token0 = getOrCreateToken(event.params.token0);
  let token1 = getOrCreateToken(event.params.token1);
  let LPtoken = getOrCreateLPToken(event.params.pair.toHexString(), token0, token1)
  let pool =CreateLiquidityPool(event,poolAddres, token0, token1, LPtoken);
  protocol.totalPoolCount += 1;
  protocol.save()

  PairTemplate.create(event.params.pair)
   
}


// let ERC20Token0 = ERC20.bind(Address.fromHexString(token0.id))
// let ERC20Token1 = ERC20.bind(Address.fromHexString(token1.id))
// let ERC20LPToken = ERC20.bind(Address.fromHexString(LPtoken.id))
// let token0Balance = ERC20Token0.balanceOf(Address.fromHexString(id))
// let token1Balance = ERC20Token1.balanceOf(Address.fromHexString(id)) 


export function handleSwap(event:Swap):void {
  let pairAddress = event.address
  let swapEntity = getOrCreateSwap(event) 
  let pool = LiquidityPool.load(pairAddress.toHexString())
  updateLiquidityPoolMetrics(event)

}

export function handleMint(event:Mint):void {
  let depositEntity = getOrCreateDeposit(event)
  updateLiquidityPoolMetrics(event)

}

export function handleBurn(event:Burn):void {
  let withdrawEntity = getOrCreateWithdraw(event)
  updateLiquidityPoolMetrics(event)
}