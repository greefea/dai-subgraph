import { Token } from "../generated/schema";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, fetchTokenTotalSupply, toDecimal,  } from "./utils";

import { SECONDS_PER_DAY,  ORACLE_ADDRESS, BIGINT_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, BIGDECIMAL_ONE } from "./constants";
import { ERC20 } from "../generated/Uniswapv2/ERC20";

// export function getOrCreateToken(tokenaddres:Address):Token {
//   // let id = tokenaddres.toHexString();
//   // let t = Token.load(id);
//   // if(t == null){
//   //   t = new Token(id);
//   //   t.symbol = fetchTokenSymbol(tokenaddres);
//   //   t.name = fetchTokenName(tokenaddres);
//   //   t.totalSupply = fetchTokenTotalSupply(tokenaddres);
//   //   t.decimals = fetchTokenDecimals(tokenaddres);
//   //   t.save();
//   // }
//   // return t
// }

export function getTokenDecimal(tokenAmount:BigInt, tokenDecimal:BigInt):BigDecimal {
  if (tokenDecimal == BIGINT_ZERO){
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(toDecimal(tokenDecimal))
}
