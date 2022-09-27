import { daily, dailyToken, dailyPool, pool, swap, token } from "../generated/schema";
import { Address, BigDecimal, BigInt,ethereum } from "@graphprotocol/graph-ts";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, fetchTokenTotalSupply, toDecimal,  } from "./utils";

import { SECONDS_PER_DAY, UNKOWN, ORACLE_ADDRESS, BIGINT_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, BIGDECIMAL_ONE, DAI_ADDRESS } from "./constants";
import { ERC20 } from "../generated/Uniswapv2/ERC20";

export function getOrCreateToken(tokenaddres:Address):token {
  let id = tokenaddres.toHexString();
  let t = token.load(id);
  if(t == null){
    t = new token(id);
    t.symbol = fetchTokenSymbol(tokenaddres);
    t.name = fetchTokenName(tokenaddres);
    t.totalSupply = fetchTokenTotalSupply(tokenaddres);
    t.decimals = fetchTokenDecimals(tokenaddres);
    t.save();
  }
  return t
}

export function getTokenDecimal(tokenAmount:BigInt, tokenDecimal:BigInt):BigDecimal {
  if (tokenDecimal == BIGINT_ZERO){
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(toDecimal(tokenDecimal))
}

export function getOrCreateDaily(id:string):daily {
    let dailyentity = daily.load(id);
    if(dailyentity){
        return dailyentity
    }else if (dailyentity == null){
        dailyentity = new daily(id);
        dailyentity.totalLiquidity = BIGDECIMAL_ZERO;
        dailyentity.totalSwapUSD = BIGDECIMAL_ZERO;
        dailyentity.totalSwapAmount = BIGDECIMAL_ZERO;
        dailyentity.swapCount = BIGDECIMAL_ZERO;
        dailyentity.swapAccountCount = BIGDECIMAL_ZERO;
        dailyentity.DAILiquidityRate = BIGDECIMAL_ZERO;
        dailyentity.DAISwapAmountRate = BIGDECIMAL_ZERO;
        dailyentity.DAISwapCountRate = BIGDECIMAL_ZERO;
        dailyentity.save();
    }
  return dailyentity
}

export function getOrCreateDailyToken(id:string):dailyToken {
    let dailytoken = dailyToken.load(id)
    if(dailytoken){
        return dailytoken
    } else if (dailytoken == null){
        dailytoken = new dailyToken(id);
        dailytoken.dailySupply = BIGDECIMAL_ZERO;
        dailytoken.dailyTransferAmount = BIGDECIMAL_ZERO;
        dailytoken.dailyTransferCount = BIGDECIMAL_ZERO;
        dailytoken.save();
    }
  return dailytoken
}

export function getOrCreatePool(id:string):pool {
  let p = pool.load(id)
    if(p != null){
        return p;
    }else if(p == null){
        p = new pool(id)
        p.token0 = UNKOWN
        p.token1 = UNKOWN
        p.reserve0 = BIGDECIMAL_ZERO;
        p.reserve1 = BIGDECIMAL_ZERO;
        p.save();
    }
  return p;
}

export function getOrCreateSwap(id:string):swap {
    let swapentity = swap.load(id);
    if(swapentity){
        return swapentity
    }else if (swapentity == null){
        swapentity = new swap(id)
        swapentity.pair = UNKOWN;
        swapentity.to = UNKOWN;
        swapentity.sender = UNKOWN;
        swapentity.amount0In = BIGINT_ZERO;
        swapentity.amount0Out = BIGINT_ZERO;
        swapentity.amount1In = BIGINT_ZERO;
        swapentity.amount1Out = BIGINT_ZERO;
        swapentity.save();
    }
  return swapentity
}

export function getOrCreateDailyPool(id:string):dailyPool {
  let dailypool = dailyPool.load(id);
  if(dailypool){
    return dailypool
  } else if (dailypool == null){
    dailypool = new dailyPool(id);
    dailypool.dailyDAILiquidity = BIGDECIMAL_ZERO;
    dailypool.save();
  }
  return dailypool
}

export function updateDailyPool(event:ethereum.Event):dailyPool {
  let dayid = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let day = dayid.toString();
  let poolAddres = event.address
  let dailypool = getOrCreateDailyPool(day.concat('_').concat(poolAddres.toHexString()));
  let daiContract = ERC20.bind(DAI_ADDRESS)
  let poolBalance = daiContract.balanceOf(poolAddres);
  dailypool.dailyDAILiquidity = poolBalance.toBigDecimal();
  dailypool.save();
  return dailypool
}