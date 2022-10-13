import { Address,BigInt,log } from "@graphprotocol/graph-ts";
import { chainlink } from "../generated/templates/Pair/chainlink";
import { BIGINT_ZERO } from "./constants";
export function getPrice(token:string):BigInt {
  let price = BIGINT_ZERO
  let contract = chainlink.bind(Address.fromString("0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"))
  let result = contract.try_latestRoundData(Address.fromString(token), Address.fromString("0x0000000000000000000000000000000000000348"))
  log.info("the token:{}",[token])
  if(!result.reverted){
    log.info("the price:{}", [result.value.value1.toString()])
    price =  result.value.value1
  }
  return price
}