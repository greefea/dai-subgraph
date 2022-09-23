import { token } from "../generated/schema";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals, fetchTokenTotalSupply, toDecimal,  } from "./utils";
import { BIGINT_ZERO } from "./constants";

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
