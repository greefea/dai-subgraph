import { BigInt, log, Address, BigDecimal} from "@graphprotocol/graph-ts";
import { DAI, Transfer } from "../generated/DAI/DAI";
import {oracle} from "../generated/DAI/oracle";
import { token, transfer, dailyTransfer, user } from "../generated/schema";

import { SECONDS_PER_DAY, ORACLE_ADDRESS, DECIMAL_18, DECIMAL_8 } from "./constants";




export function handleTransfer(event: Transfer): void {
  let contract = oracle.bind(ORACLE_ADDRESS)
  let priceValue = contract.latestAnswer();
  let price = priceValue.toBigDecimal().div(DECIMAL_8)


  let dai = token.load(event.address.toHexString());
  if (dai == null) {
    dai = new token(event.address.toHexString());
  }
  let daiContract = DAI.bind(event.address);
  dai.decimals = daiContract.decimals();
  dai.symbol = daiContract.symbol();
  dai.supply = daiContract.totalSupply();
  dai.save();

  let records = transfer.load(event.transaction.hash.toHexString());
  if (records == null) {
    records = new transfer(event.transaction.hash.toHexString());
  }

  records.to = event.params.dst.toHexString();
  records.from = event.params.src.toHexString();
  records.amount = event.params.wad;
  records.amountUSD = (event.params.wad).toBigDecimal().div(DECIMAL_18).times(price);
  records.save();

  let dayInt = event.block.timestamp;
  let dayId = (dayInt.toI32() - (dayInt.toI32()%SECONDS_PER_DAY));
  let dayValue = dayInt.times(BigInt.fromI32(1000));
  let dateName = new Date(dayValue.toI64()).toISOString().slice(0,10);

  let daily = dailyTransfer.load(dayId.toString());
  if (daily == null) {
    daily = new dailyTransfer(dayId.toString());
    daily.dateName = dateName;
    daily.amount = event.params.wad;
    daily.transfers = 0;
    daily.amountUSD = BigDecimal.fromString('0')
  }

  //store From and To address
  //id = timestamp - address
  let userIdFrom = dayInt.toString() + "-" + event.params.src.toHexString();
  let userIdTo = dayInt.toString() + "-" + event.params.dst.toHexString();

  let u1 = user.load(userIdFrom);
  if(u1 == null) {
    u1 = new user(userIdFrom);
    u1.isTo = 0;
    daily.transfers += 1;
  }
  u1.isFrom = 1;
  u1.save();

  let u2 = user.load(userIdTo);
  if(u2 == null){
    u2 = new user(userIdTo);
    u2.isFrom = 0;
    daily.transfers += 1;
  }
  u2.isTo = 1;
  u2.save();

  daily.amount = daily.amount.plus(event.params.wad);
  let temp_amountUSD = daily.amountUSD!
  daily.amountUSD = temp_amountUSD.plus((event.params.wad).toBigDecimal().div(DECIMAL_18).times(price) );
  daily.save();
}
